const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const BoxAlignment = Clutter.BoxAlignment;


const Main = imports.ui.main;


const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


const PasswordWidget = new Lang.Class({
    Name: 'PasswordWidget',
    Extends: PopupMenu.PopupMenuItem,

    _init: function(password) {

      var name = password.name;
      debug('PasswordWidget._init ' + name);


      this.id = name;
      this.parent(
        name,
        {
          reactive: true,
          style_class: 'password-result'
        }
      );

      let hbox = new St.BoxLayout({
        style_class: 'password-folder-display',
        y_expand: true,
        x_align: St.Align.END,
        y_align: Clutter.ActorAlign.CENTER
      });

      let label = new St.Label({
        text: password.folder,
        y_expand: true,
        x_align: St.Align.END,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'password-folder-name'
      });


      /*
      let editBtn = new St.Icon({
        icon_name: "accessories-text-editor-symbolic",
        icon_size: 18,
        style_class: 'password-edit'
      });
      */

      let systemMenu = Main.panel.statusArea['aggregateMenu']._system;

      let userBtn = systemMenu._createActionButton('system-users-symbolic', "Copy Username");
      userBtn.connect('clicked', function() {
        debug('Clicked user button!')
        Me.trigger('usernameSelected', password);
      });
      let editBtn = systemMenu._createActionButton('accessories-text-editor-symbolic', "Edit Password");
      editBtn.connect('clicked', function() {
        debug('Clicked edit button!');
        Me.trigger('editSelected', password);
      })
      

      hbox.add_child(label);
      //hbox.add_child(userBtn);
      //hbox.add_child(editBtn);
      this.actor.add_child(hbox);
      this.actor.add_child(userBtn);
      this.actor.add_child(editBtn);


      //this._name = name;

      //this._label = new St.Label({ text: this._name });
      //this.actor.add_child(this._label);

      this.connect('activate', onActivate);

      function onActivate(actor) {
        Me.trigger('passwordSelected', password);
      }
    },

    destroy: function() {

      debug('PasswordWidget.destroy');

      this.parent();
    },
/*
    activate: function(event) {

      debug('PasswordWidget.activate');

      //var password = this._passwordStore.getPassword(this._name);

      //this.parent(event);

      activateCallback.call(global, this._name);

      //this.parent.event(e)
      //this._info.launch(event.get_time());
      //this.parent(event);
    },
*/
});


function debug(obj, prefix) {

  if (typeof obj === 'string') {
    global.log(obj);
    return;
  }

  if (typeof obj === 'object') {

    if (!prefix) prefix = '';
    let newPrefix = prefix + '  ';
    var keys = Object.keys(obj);
    global.log(prefix + '{');
    for (var i in keys) {
      if (keys.hasOwnProperty(i)) {
        var key = keys[i]
        if (typeof obj[key] === 'object') {
          debug(obj[key], newPrefix);
        }
        else {
          global.log(newPrefix + key + ': ' + obj[key]);
        }
      }
    }
    global.log(prefix + '}');

    return;
  }

  global.log(obj);
}
