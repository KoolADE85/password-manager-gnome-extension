const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;


const PasswordWidget = new Lang.Class({
    Name: 'PasswordWidget',
    Extends: PopupMenu.PopupMenuItem,

    _init: function(name) {

      debug('PasswordWidget._init ' + name);


      this.id = name;
      this.parent(
        name,
        { reactive: true }
      );
      //this._name = name;

      //this._label = new St.Label({ text: this._name });
      //this.actor.add_child(this._label);

      //this.actor.connect('activate', this.activate);
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
