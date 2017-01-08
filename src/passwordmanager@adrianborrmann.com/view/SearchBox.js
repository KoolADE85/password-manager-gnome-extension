const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;


const SearchBox = new Lang.Class({
  Name: 'SearchBox',
  Extends: PopupMenu.PopupBaseMenuItem,

  _init: function(searchCallback, selectCallback) {
    debug('New Search Box');

    this.parent();
    let hbox = new St.BoxLayout({ style_class: 'search-box' });
    /*let label = new St.Label({
      text: _("Search"),
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER
    });
    */

    //hbox.add_child(label);
    var icon = new St.Icon({
      icon_name: 'system-search-symbolic',
      icon_size: 16,
    });

    var search = new St.Entry({
      hint_text: 'Search passwords...',
      style_class: 'search-input',
    });
    this.searchBox = search;

    search.get_clutter_text().connect('text-changed', function() {
      debug('SearchBox.Clutter.changed: ' + search.text);
      var keyword = search.text;
      debug(keyword);
      debug(search.hint_text);
      if (keyword == search.hint_text) {
        searchCallback.call(global, '');
      }
      else {
        searchCallback.call(global, keyword);
      }
    });

    search.get_clutter_text().connect('activate', function() {
      debug('SearchBox.Clutter.activate');
      selectCallback.call();
    });

    //hbox.add_child(search);
    //hbox.add_child(icon);
    //this.actor.add_actor(hbox);
    this.actor.add_child(search);
    this.actor.add_child(icon);

    function focus() {

      GLib.timeout_add(
        GLib.PRIORITY_DEFAULT,
        50,
        function() {
          search.grab_key_focus();
          return false; // Don't repeat
        },
        null
      );

    }
    this.focus = focus;
  },

  activate: function(event) {

    debug('SearchBox.activate');
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
