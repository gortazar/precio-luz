/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

'use strict';

const {St, Gio, Clutter, Soup, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

let panelButton;
let panelButtonText;
let _httpSession;
let _dollarQuotation;
let sourceId = null;

// Start application
function init(){
    log(`initializing ${Me.metadata.name}`);
}

// Add the button to the panel
function enable() {
    log(`enabling ${Me.metadata.name}`);
    panelButton = new St.Bin({
        style_class : "panel-button",
    });

    load_json_async();
    Main.panel._rightBox.insert_child_at_index(panelButton, 0);
    sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => {
        load_json_async();
        return GLib.SOURCE_CONTINUE;
    });
}

// Remove the added button from panel
function disable(){
    log(`disabling ${Me.metadata.name}`);
    Main.panel._rightBox.remove_child(panelButton);
    
    if (panelButton) {
        panelButton.destroy();
        panelButton = null;
    }   
    if (sourceId) {
        GLib.Source.remove(sourceId);
        sourceId = null;
    }
}

// Requests energy pricing
function load_json_async(){
    if (_httpSession === undefined) {
        _httpSession = new Soup.Session();
    } else {
        _httpSession.abort();
    }

    let message = Soup.form_request_new_from_hash(
        'GET', 
        "https://api.preciodelaluz.org/v1/prices/now", 
        {"zone":"PCB"});
    
    _httpSession.queue_message(message, () => {
        try {
            if (!message.response_body.data) {
                panelButtonText = new St.Label({
                    text : "💡 ? €/kWh)",
                    y_align: Clutter.ActorAlign.CENTER,
                });
                panelButton.set_child(panelButtonText);
                _httpSession.abort();
                return;
            }

            let jp = JSON.parse(message.response_body.data);
            let price = jp["price"];
            price = price / 1000.0; // Convert from MWh to kWh
   
            let _style = "standard-style";
            if(jp["is-cheap"]) {

                _style = "cheap-style"
            } else if(jp["is-under-avg"]) {
                    _style = "under-avg-style"
            }
            panelButtonText = new St.Label({
                text : "💡" + price.toFixed(3) + " €/kWh",
                y_align: Clutter.ActorAlign.CENTER,
                style_class: _style
            });

            panelButton.set_child(panelButtonText);
            _httpSession.abort();
            return;

        } catch (e) {
            panelButtonText = new St.Label({
                text : "Luz error",
                y_align: Clutter.ActorAlign.CENTER,
            });

            panelButton.set_child(panelButtonText);
            _httpSession.abort();
            return;
        }
    });
}
