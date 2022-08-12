# Precio-luz

Extension to Gnome-Shell v.(36,38,40,41,42), for energy price information (Spain).

![Popup menu with price per hour](https://github.com/gortazar/precio-luz/blob/price-by-hour-in-menu-item/energy-pricing-gnome-shell-extension.gif)

# Licence
```
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
SPDX-License-Identifier: GPL-2.0-or-later
```
# How to install
```
cd /tmp && git clone https://github.com/gortazar/precio-luz.git && mv dollar-pkr precio-luz@gortazar.github.com && cp -av precio-luz@gortazar.github.com ~/.local/share/gnome-shell/extensions/ && gnome-shell-extension-tool --enable-extension precio-luz@gortazar.github.com && rm -rf precio-luz@gortazar.github.com .
Or just download precio-luz@gortazar.github.com.zip form releases and unzip precio-luz@gortazar.github.com to ~/.local/share/gnome-shell/extensions/ .
```
To restart GNOME Shell in X11, pressing Alt+F2 to open the Run Dialog and enter restart 
(or just r). 
In Wayland Log out and Login agaian.

# How to debug

Debug info is shown in journalctl:

```
journalctl -f -o cat /usr/bin/gnome-shell
```

Alternatively, error logs can also be debugged with looking glass: press Alt+F2, and then type lg
