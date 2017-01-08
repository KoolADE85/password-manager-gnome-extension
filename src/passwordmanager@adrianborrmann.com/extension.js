const St = imports.gi.St;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;

const Tweener = imports.ui.tweener;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;

const PasswordStore = Me.imports.model.PasswordStore;
const UiDropdown = Me.imports.view.UiDropdown;
const Utils = Me.imports.utils;

const mySettings = Utils.getSettings();

let text, button;

global.log("WELCOME TO PASSWORD MANAGER EXTENSION");


const PasswordExtension = new Lang.Class({
  Name: 'PasswordExtension',

  _init: function() {

    debug('PasswordExtension - _init');

    let callbacks = {
      _onPasswordSelected: _onPasswordSelected,
      _onSearch: _onSearch,
    };

    let uiDropdown = new UiDropdown.Dropdown(callbacks);
    this.uiDropdown = uiDropdown;
    Main.panel.addToStatusArea('passMenu', uiDropdown);

    let passwordStore = new PasswordStore.PasswordStore();


    uiDropdown.actor.connect('captured-event', _onCapturedEvent);
    //uiDropdown.connect('activate', _onButtonActivated);
    //uiDropdown.actor.connect('password-selected', _onPasswordSelected);
    //this._restacked = global.screen.connect('restacked', _getWindowList);


    Main.wm.addKeybinding(
      'toggle-password-manager',
      mySettings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.NORMAL | Shell.ActionMode.MESSAGE_TRAY,
      _onKeyActivated
    );

    function _onKeyActivated(a,b,c) {

      debug('Hotkey activated!');
      uiDropdown.menu.open();
      _onButtonActivated();
    }



    function _onCapturedEvent(actor, event) {
      if (event.type() == Clutter.EventType.BUTTON_PRESS) {
        _onButtonActivated(actor);
      }
    }


    function _onButtonActivated(actor) {
      debug('PasswordExtension - _onButtonActivated');

      if (uiDropdown.searchInput) {
        _showSearchResults(uiDropdown.searchInput);
      }
      else {
        _showWindowResults();
      }

      uiDropdown.focusSearch();
    }


    function _onPasswordSelected(actor) {

      debug('Extension._onPasswordSelected');
      passwordStore.getPassword(actor.id);
    }


    function _onSearch(keyword) {

      if (keyword === '') {
        _showWindowResults();
      }
      else {
        _showSearchResults(keyword);
      }
    }


    function _showSearchResults(keyword) {
      var passwords = passwordStore.match([keyword]);
      uiDropdown.clearPasswords();
      uiDropdown.addPasswords(passwords);
    }

    function _showWindowResults() {
      var passwords = passwordStore.match(_getWindowList());
      uiDropdown.clearPasswords();
      uiDropdown.addPasswords(passwords);
    }


    function _getWindowList() {

      debug('PasswordExtension - _getWindowList');

      let tracker = Shell.WindowTracker.get_default();
      var windowTitles = [];         

      let windows = global.screen.get_active_workspace().list_windows();
      windows.forEach(function(win) {
        let title = String(win.get_title());
        windowTitles.push(title.toLowerCase());
      });

      return windowTitles;
    }

  },


  destroy: function() {

    debug('PasswordExtension.destroy');
    global.display.remove_keybinding('toggle-password-manager');
    this.uiDropdown.destroy();
  },

});


/*
const PasswordIndicatorButton = new Lang.Class({
  Name: 'PasswordIndicatorButton',
  Extends: PanelMenu.Button,

  _init: function() {
    debug('PasswordIndicatorButton._init');

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

    this.passwordStore = new PasswordStore.PasswordStore();
    this._uiSections = { };

    this.actor.connect('captured-event', Lang.bind(this, this._onCapturedEvent));
  },

  _onCapturedEvent: function(actor, event) {

    if (event.type() == Clutter.EventType.BUTTON_PRESS) {
      this._passwords = this.passwordStore.getList();
      this._displayMatchingWindows();
    }
  },

  _displayMatchingWindows: function() {

    let matches = [];
    let passwords = this._passwords;
    for (let i=0; i<passwords.length; i++) {
      let password = passwords[i];
      for (let j=0; j<this._windowTitles.length; j++) {
        let windowTitle = this._windowTitles[j];
        //debug(windowTitle + ' vs ' + password);
        if (windowTitle.indexOf(password.toLowerCase()) > -1) {
          matches.push(password);
          break;
        }
      }
    }

    debug(this._windowTitles);
    debug(this._passwords);
    this._displayPasswordList(matches);
  },

  _removePasswordList: function() {

    debug('PasswordIndicatorButton._removePasswordList');
    this.menu.removeAll();
  },

  _displayPasswordList: function(list) {

    debug('PasswordIndicatorButton._displayPasswordList');

    this._removePasswordList();

    var popup = new PopupContents.Display();
    popup.clearPasswords();
    popup.addPasswords(list);
    this.menu.addMenuItem(popup);
    return;

    this._uiSections['passwordList'] = new PopupMenu.PopupMenuSection();

    for (let i=0; i<list.length; i++) {
      this._uiSections['passwordList'].addMenuItem(new PasswordMenuItem(list[i], this.passwordStore));
    }

    var search = new SearchBox();
    this.menu.addMenuItem(search);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this.menu.addMenuItem(this._uiSections['passwordList']);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this.menuOpened = true;

    global.stage.set_key_focus(search.searchBox);

  },
});
*/

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




function init() {

  debug('Extension INIT');
}

function enable() {

  debug('Extension ENABLE');
  //Main.panel._rightBox.insert_child_at_index(button, 0);
  this.passwordExtension = new PasswordExtension();
}

function disable() {

  debug('Extension DISABLE');
  this.passwordExtension.destroy();
  //Main.panel._rightBox.remove_child(button);
}


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
