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
 *
 */

defined('MOODLE_INTERNAL') || die();

$services = [
    'tiny_qrcode_generate' => [
        'functions' => ['tiny_qrcode_generate_qr_code'],
        'restrictedusers' => 0,
        'enabled' => 1,
    ],
];

$functions = [
    'tiny_qrcode_generate_qr_code' => [
        'classname'   => 'tiny_qrcode_external',
        'methodname'  => 'generate_qr_code',
        'classpath'   => 'lib/editor/tiny/plugins/qrcode/externallib.php',
        'description' => 'Generate a QR code with custom parameters',
        'type'        => 'read',
        'ajax'        => true,
    ],
];
