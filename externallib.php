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

/**
 * Tiny qrcode plugin.
 *
 * @package    tiny_qrcode
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/lib/editor/tiny/plugins/qrcode/thirdparty/vendor/autoload.php');
require_once($CFG->dirroot . '/course/lib.php');

use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;

/**
 * External function tiny_qrcode_external
 */
class tiny_qrcode_external extends external_api {
    /**
     * Generate QR code function.
     *
     * @param array $data An associative array containing the following keys:
     *   - content (string): QR code content.
     *   - size (int): QR code size.
     *   - margin (int): QR code margin.
     *   - bgColor (string): Background color as a JSON string.
     *   - fgColor (string): Foreground color as a JSON string.
     * @return array The generated QR code data or metadata.
     */
    public static function generate_qr_code($data) {
        global $CFG;
        $message = "inside external";
        error_log($message);
        
        // Validate context.
        $context = context_system::instance();
        self::validate_context($context);

        // Validate parameters.
        $params = self::validate_parameters(
            self::generate_qr_code_parameters(),
            array('data' => $data)
        );
        
        $data = json_decode($params['data']);

        // Validate and parse inputs.
        $content = clean_param($data->content, PARAM_URL);
        $size = $data->size;
        $margin = $data->margin;

        // Parse color inputs.
        $bgcolordata = $data->bgColor;
        $fgcoloraata = $data->fgColor;

        try {
            // Generate QR Code.
            $writer = new PngWriter();
            $qrcode = new QrCode(
                data: $content,
                encoding: new Encoding('UTF-8'),
                errorCorrectionLevel: ErrorCorrectionLevel::Low,
                size: $size,
                margin: $margin,
                roundBlockSizeMode: RoundBlockSizeMode::Margin,
                foregroundColor: new Color($fgcoloraata->r, $fgcoloraata->g, $fgcoloraata->b),
                backgroundColor: new Color($bgcolordata->r, $bgcolordata->g, $bgcolordata->b)
            );

            $result = $writer->write($qrcode);
            $datauri = $result->getDataUri();

            return array(
                'status' => true,
                'datauri' => $datauri
            );

        } catch (Exception $e) {
            return array(
                'status' => false,
                'datauri' => 'Error generating QR code: ' . $e->getMessage()
            );
        }
    }

    /**
     * Parameters description for web service
     *
     * @return external_function_parameters
     */
    public static function generate_qr_code_parameters() {
        return new external_function_parameters(
            array(
                'data' => new external_value(PARAM_TEXT, 'Content of the QR code', VALUE_REQUIRED)
            )
        );
    }

    /**
     * Return description for web service
     *
     * @return external_single_structure
     */
    public static function generate_qr_code_returns() {
        return new external_single_structure(
            array(
                'status' => new external_value(PARAM_BOOL, 'Status of QR code generation'),
                'datauri' => new external_value(PARAM_TEXT, 'Data URI of generated QR code', VALUE_OPTIONAL)
            )
        );
    }
}