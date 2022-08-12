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

const {St, Gio, GObject, Clutter, Soup, GLib} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let panelButton;
let panelButtonText;
let _httpSession;
let sourceId = null;

// Start application
function init(){
    log(`initializing ${Me.metadata.name}`);
}


let energyPricingManager

// Add the button to the panel
function enable() {
    log(`enabling ${Me.metadata.name}`);

    energyPricingManager = new EnergyPricingManager();
    
    Main.panel.addToStatusArea(Me.metadata.name, energyPricingManager, 1);
}

// Remove the added button from panel
function disable(){
    log(`disabling ${Me.metadata.name}`);
    Main.panel.removeFromStatusArea(energyPricingManager);
    
    if (energyPricingManager) {
        energyPricingManager.destroy();
        energyPricingManager = null;
    }   
    if (sourceId) {
        GLib.Source.remove(sourceId);
        sourceId = null;
    }
}

const EnergyPricingManager = GObject.registerClass({
    GTypeName: 'EnergyPricingManager'
}, class EnergyPricingManager extends PanelMenu.Button {
    _init () {
        super._init(0)
        log('epm._init')

        panelButton = new St.Bin({
            style_class : "panel-button",
        });
        this.add_child(panelButton)
        this.load_json_async();
        
        sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3600, () => {
            this.load_json_async();
            return GLib.SOURCE_CONTINUE;
        });
    }

    // Requests energy pricing
    load_json_async(){
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
    
                let _style = this.getStyle(jp);
                panelButtonText = new St.Label({
                    text : "💡" + price.toFixed(3) + " €/kWh",
                    y_align: Clutter.ActorAlign.CENTER,
                    style_class: _style
                });

                panelButton.set_child(panelButtonText);
                _httpSession.abort();
                return;

            } catch (e) {

                logError(e);

                panelButtonText = new St.Label({
                    text : "Luz error",
                    y_align: Clutter.ActorAlign.CENTER,
                });

                panelButton.set_child(panelButtonText);
                _httpSession.abort();
                return;
            }
        });

        let messageAll = Soup.form_request_new_from_hash(
            'GET', 
            "https://api.preciodelaluz.org/v1/prices/all", 
            {"zone":"PCB"});

        _httpSession.queue_message(messageAll, () => {
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

                print('ok');
                // clean menu
                this.menu._getMenuItems().forEach(function (i) { i.destroy() })
                print('ok');
                log(messageAll.response_body.data);
                let jp = JSON.parse(messageAll.response_body.data);
                let map = new Map(Object.entries(jp));
                map.forEach((key, value) => {
                    this.addMenuLabel(key, value);
                });

                _httpSession.abort();
                return;

            } catch (e) {

                logError(e);

                panelButtonText = new St.Label({
                    text : "Error",
                    y_align: Clutter.ActorAlign.CENTER,
                });

                panelButton.set_child(panelButtonText);
                _httpSession.abort();
                return;
            }
        });
    }

    getStyle(jp) {
        let _style = "standard-style";
        if (jp["is-cheap"]) {

            _style = "cheap-style";
        } else if (jp["is-under-avg"]) {
            _style = "under-avg-style";
        }
        return _style;
    }

    addMenuLabel(value, key) {
        console.log(`data[${key}] = ${value}`);

        const menuLabel = new PopupMenu.PopupMenuItem(
            key,
            {reactive: false});

        let price = value["price"];
        price = price / 1000.0;

        let _style = this.getStyle(value);
        const itemLabelText = new St.Label({
            text : "💡" + price.toFixed(3) + " €/kWh",
            y_align: Clutter.ActorAlign.CENTER,
            style_class: _style
        });

        menuLabel.add_child(itemLabelText);

        this.menu.addMenuItem(menuLabel);
    }

})

