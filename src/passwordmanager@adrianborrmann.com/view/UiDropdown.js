const Lang = imports.lang;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;

const PasswordExtension = ExtensionUtils.getCurrentExtension();
const PasswordWidget = PasswordExtension.imports.view.PasswordWidget;



const Dropdown = new Lang.Class({
  Name: 'Dropdown',
  Extends: PanelMenu.Button,

  _init: function(callbacks) {
    debug('New Dropdown');
    this.parent(0.0, _("Passwords"));

    let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
    let label = new St.Label({
      text: _("Passwords"),
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER
    });

    hbox.add_child(label);
    hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
    this.actor.add_actor(hbox);


    var passwordWidgets = [];
    this.addPasswords = addPasswords;
    this.clearPasswords = clearPasswords;


    function addPasswords(passwords) {
      for (var i=0; i<passwords.length; i++) {
        var widget = new PasswordWidget.PasswordWidget(passwords[i]);
        //widget.actor.connect('activate', callbacks._onPasswordSelected);
        passwordWidgets.push(widget);
      }

      for (var j=0; j<passwordWidgets.length; j++) {
        this.menu.addMenuItem(passwordWidgets[j]);
      }
    }

    function clearPasswords() {
      
      this.menu.removeAll();
      passwordWidgets = [];
    }
  }
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
