<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace tiny_qrcode\external;

use context_system;
use context_helper;
use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use invalid_parameter_exception;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\Writer\SvgWriter;
use Endroid\QrCode\ErrorCorrectionLevel;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/lib/editor/tiny/plugins/qrcode/thirdparty/vendor/autoload.php');

/**
 * External function to generate QR codes.
 *
 * @package    tiny_qrcode
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class generate_qr_code extends external_api {
    /** Minimum allowable QR code size in pixels. */
    const MIN_SIZE = 50;
    /** Maximum allowable QR code size in pixels to prevent DoS. */
    const MAX_SIZE = 1000;
    /** Minimum allowable margin in modules. */
    const MIN_MARGIN = 0;
    /** Maximum allowable margin in modules. */
    const MAX_MARGIN = 50;

    /**
     * Parameters description for generate_qr_code web service.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'contextid' => new external_value(PARAM_INT, 'The context ID', VALUE_DEFAULT, null),
            'content' => new external_value(PARAM_RAW_TRIMMED, 'Content or URL of the QR code', VALUE_REQUIRED),
            'size' => new external_value(PARAM_INT, 'QR code dimension in pixels', VALUE_DEFAULT, 200),
            'margin' => new external_value(PARAM_INT, 'Quiet zone margin in modules', VALUE_DEFAULT, 10),
            'bgcolor' => new external_single_structure([
                'r' => new external_value(PARAM_INT, 'Red component 0-255', VALUE_DEFAULT, 255),
                'g' => new external_value(PARAM_INT, 'Green component 0-255', VALUE_DEFAULT, 255),
                'b' => new external_value(PARAM_INT, 'Blue component 0-255', VALUE_DEFAULT, 255),
            ], 'Background RGB color', VALUE_DEFAULT, []),
            'fgcolor' => new external_single_structure([
                'r' => new external_value(PARAM_INT, 'Red component 0-255', VALUE_DEFAULT, 0),
                'g' => new external_value(PARAM_INT, 'Green component 0-255', VALUE_DEFAULT, 0),
                'b' => new external_value(PARAM_INT, 'Blue component 0-255', VALUE_DEFAULT, 0),
            ], 'Foreground RGB color', VALUE_DEFAULT, []),
            'ecc' => new external_value(
                PARAM_ALPHA,
                'Error correction level: low, medium, quartile, high',
                VALUE_DEFAULT,
                'medium'
            ),
            'format' => new external_value(
                PARAM_ALPHA,
                'Image output format: png, svg',
                VALUE_DEFAULT,
                'png'
            ),
        ]);
    }

    /**
     * Generate a QR code image as a Data URI PNG or SVG.
     *
     * @param int|null $contextid
     * @param string $content
     * @param int $size
     * @param int $margin
     * @param array $bgcolor
     * @param array $fgcolor
     * @param string $ecc
     * @param string $format
     * @return array
     */
    public static function execute(
        ?int $contextid = null,
        string $content = '',
        int $size = 200,
        int $margin = 10,
        array $bgcolor = [],
        array $fgcolor = [],
        string $ecc = 'medium',
        string $format = 'png'
    ): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'contextid' => $contextid,
            'content' => $content,
            'size' => $size,
            'margin' => $margin,
            'bgcolor' => $bgcolor,
            'fgcolor' => $fgcolor,
            'ecc' => $ecc,
            'format' => $format,
        ]);

        $context = $params['contextid'] ? context_helper::instance_by_id($params['contextid']) : context_system::instance();
        self::validate_context($context);
        require_capability('tiny/qrcode:use', $context);

        if (trim($params['content']) === '') {
            throw new invalid_parameter_exception('QR code content cannot be empty.');
        }

        // Clamp dimensions safely to prevent DoS/OOM.
        $size = max(self::MIN_SIZE, min(self::MAX_SIZE, $params['size']));
        $margin = max(self::MIN_MARGIN, min(self::MAX_MARGIN, $params['margin']));

        $bgr = max(0, min(255, $params['bgcolor']['r'] ?? 255));
        $bgg = max(0, min(255, $params['bgcolor']['g'] ?? 255));
        $bgb = max(0, min(255, $params['bgcolor']['b'] ?? 255));

        $fgr = max(0, min(255, $params['fgcolor']['r'] ?? 0));
        $fgg = max(0, min(255, $params['fgcolor']['g'] ?? 0));
        $fgb = max(0, min(255, $params['fgcolor']['b'] ?? 0));

        $ecclevel = ErrorCorrectionLevel::tryFrom(strtolower($params['ecc'])) ?? ErrorCorrectionLevel::Medium;
        $writer = (strtolower($params['format']) === 'svg') ? new SvgWriter() : new PngWriter();

        try {
            $qrcode = new QrCode(
                data: $params['content'],
                errorCorrectionLevel: $ecclevel,
                size: $size,
                margin: $margin,
                foregroundColor: new Color($fgr, $fgg, $fgb),
                backgroundColor: new Color($bgr, $bgg, $bgb)
            );

            $result = $writer->write($qrcode);

            return [
                'status' => true,
                'datauri' => $result->getDataUri(),
                'error' => '',
            ];
        } catch (\Throwable $e) {
            debugging('tiny_qrcode: QR generation failed - ' . $e->getMessage(), DEBUG_DEVELOPER);
            return [
                'status' => false,
                'datauri' => '',
                'error' => get_string('qrcode_insert_failed', 'tiny_qrcode'),
            ];
        }
    }

    /**
     * Return structure for generate_qr_code web service.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'status' => new external_value(PARAM_BOOL, 'Status of QR code generation'),
            'datauri' => new external_value(PARAM_RAW, 'Data URI of generated QR code', VALUE_OPTIONAL),
            'error' => new external_value(PARAM_TEXT, 'Error message if generation failed', VALUE_OPTIONAL),
        ]);
    }
}
