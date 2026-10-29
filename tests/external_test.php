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

namespace tiny_qrcode;

use advanced_testcase;
use tiny_qrcode\external\generate_qr_code;

/**
 * Unit tests for tiny_qrcode external API.
 *
 * @package    tiny_qrcode
 * @copyright  2024 Brain Station 23 Ltd. <brainstation-23.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \tiny_qrcode\external\generate_qr_code
 */
final class external_test extends advanced_testcase {
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
    }

    /**
     * Test successful QR code generation for an authenticated user.
     */
    public function test_generate_qr_code_successful(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        $result = generate_qr_code::execute(
            contextid: null,
            content: 'https://moodle.org',
            size: 150,
            margin: 5,
            bgcolor: ['r' => 255, 'g' => 255, 'b' => 255],
            fgcolor: ['r' => 0, 'g' => 0, 'b' => 0]
        );

        $this->assertTrue($result['status']);
        $this->assertStringStartsWith('data:image/png;base64,', $result['datauri']);
        $this->assertEmpty($result['error']);
    }

    /**
     * Test boundary enforcement against DoS/OOM (oversized parameters are clamped).
     */
    public function test_generate_qr_code_enforces_bounds(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        // Send extreme oversize values that previously caused OOM crashes.
        $result = generate_qr_code::execute(
            contextid: null,
            content: 'Boundary Test',
            size: 50000,
            margin: 100
        );

        $this->assertTrue($result['status']);
        $this->assertNotEmpty($result['datauri']);
    }

    /**
     * Test empty content validation throws exception.
     */
    public function test_generate_qr_code_empty_content(): void {
        $user = $this->getDataGenerator()->create_user();
        $this->setUser($user);

        $this->expectException(\invalid_parameter_exception::class);
        generate_qr_code::execute(
            contextid: null,
            content: '   '
        );
    }

    /**
     * Test that guest/unauthenticated calls are rejected with an exception.
     */
    public function test_generate_qr_code_requires_login(): void {
        $this->expectException(\require_login_exception::class);
        generate_qr_code::execute(
            contextid: null,
            content: 'https://example.com'
        );
    }
}
