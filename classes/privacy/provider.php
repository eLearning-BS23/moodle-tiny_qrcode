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

namespace tiny_qrcode\privacy;

/**
 * Privacy Subsystem implementation for the qrcode plugin for TinyMCE.
 *
 * @package    tiny_qrcode
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

  /**
   * Qrcode plugin for TinyMCE.
   *
   */
class provider implements \core_privacy\local\metadata\null_provider {
    /**
     * Qrcode plugin for TinyMCE.
     *
     */
    public static function get_reason(): string {
        return 'privacy:metadata';
    }
}

