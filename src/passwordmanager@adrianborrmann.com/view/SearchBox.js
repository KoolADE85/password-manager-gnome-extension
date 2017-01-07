
const SearchBox = new Lang.Class({
  Name: 'SearchBox',
  Extends: PopupMenu.PopupBaseMenuItem,

  _init: function() {
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
      icon_name: 'system-search',
      style_class: 'system-status-icon'
    });

    var search = new St.Entry({
      hint_text: 'Search passwords...',
      style_class: 'search-input',
    });
    this.searchBox = search;

    //hbox.add_child(search);
    //hbox.add_child(icon);
    //this.actor.add_actor(hbox);
    this.actor.add_child(search);

  }

});

