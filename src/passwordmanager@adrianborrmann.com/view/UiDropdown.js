const Lang = imports.lang;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;

const PasswordExtension = ExtensionUtils.getCurrentExtension();
const PasswordWidget = PasswordExtension.imports.view.PasswordWidget;
const SearchBox = PasswordExtension.imports.view.SearchBox;

const Me = ExtensionUtils.getCurrentExtension();


const Dropdown = new Lang.Class({
  Name: 'Dropdown',
  Extends: PanelMenu.Button,

  _init: function() {
    debug('New Dropdown');
    this.parent(0.0, _("Passwords"));

    var menu = this.menu;

    let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
    
/*
    let label = new St.Label({
      text: _("Passwords"),
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER

    });
*/

    let icon = new St.Icon({
      icon_name: 'dialog-password-symbolic',
      icon_size: 18,
    });
    hbox.add_child(icon);

    //hbox.add_child(label);
    hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
    this.actor.add_actor(hbox);

    Me.on('searchSelect', _onSearchSelect);

    var searchBox = new SearchBox.SearchBox();
    this.searchBox = searchBox;
    this.menu.addMenuItem(searchBox);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());


    var passwordWidgets = [];
    var passwordWidgetsUI = new PopupMenu.PopupMenuSection()
    this.addPasswords = addPasswords;
    this.clearPasswords = clearPasswords;
    this.focusSearch = focusSearch;


    function addPasswords(passwords) {
      for (var i=0; i<passwords.length; i++) {
        debug(passwords[i].name);
        var widget = new PasswordWidget.PasswordWidget(passwords[i]);
        //widget.connect('activate', callbacks._onPasswordSelected);
        passwordWidgets.push(widget);
        passwordWidgetsUI.addMenuItem(passwordWidgets[i]);
      }
    }

    this.menu.addMenuItem(passwordWidgetsUI);

    function clearPasswords() {
      
      passwordWidgetsUI.removeAll();
      passwordWidgets = [];
    }

    function focusSearch() {
      searchBox.focus();
    }

    function _onSearchSelect() {

      debug('UiDropdown._onSearchSelect');
      menu.close();
      Me.trigger('passwordSelected', passwordWidgets[0]);
    }
  },

  get searchInput() {
    if (
      this.searchBox.text == '' ||
      this.searchBox.text == this.searchBox.hint_text) {
      return false;
    }
    return this.searchBox.text;
  },
});



function debug(obj) {

  if (typeof obj === 'string') {
    global.log(obj);
    return;
  }

  if (typeof obj === 'object') {

    var keys = Object.keys(obj);
    global.log("OBJECT KEYS:");
    for (var i in keys) {
      if (keys.hasOwnProperty(i)) {
        var key = keys[i]
        global.log('  ' + key + ': ' + obj[key]);
      }
    }

    return;
  }

  global.log(obj);
}
