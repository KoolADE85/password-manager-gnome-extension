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

    debug(Clutter.EventType);

    Me.on('passwordSelected', _onPasswordSelected);
    Me.on('userSelected', _onUserSelected);
    Me.on('editSelected', _onEditSelected);
    Me.on('search', _onSearch);

    let uiDropdown = new UiDropdown.Dropdown();
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
      if (event.type() == Clutter.EventType.BUTTON_PRESS || event.type() == Clutter.EventType.KEY_PRESS) {
        _onButtonActivated(actor);
      }
    }


    function _onButtonActivated(actor) {
      debug('PasswordExtension - _onButtonActivated');

      var searchText = uiDropdown.searchInput;
      if (searchText) {
        _showSearchResults(uiDropdown.searchInput);
      }
      else {
        _showWindowResults();
      }

      uiDropdown.focusSearch();
    }


    function _onPasswordSelected(passwordEntry) {

      debug('Extension._onPasswordSelected');
      passwordStore.getPassword(passwordEntry.folder + passwordEntry.name);
    }


    function _onEditSelected(passwordEntry) {
      debug('Extension._onEditSelected');
      passwordStore.edit(passwordEntry.folder + passwordEntry.name);
    }


    function _onUserSelected(passwordEntry) {

      debug('Extension._onUserSelected');
      passwordStore.getUser(passwordEntry.folder + passwordEntry.name);
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

Me._triggerListeners = {};

Me.on = function(name, callback) {
    //window.console.log('CaffeineEventDispatcher - adding on ' + name);
    if (typeof name === 'undefined') throw new Error('Cannot listen for undefined event');
    if (!Me._triggerListeners[name]) {
        Me._triggerListeners[name] = [];
    }
    Me._triggerListeners[name].push(callback);
}

Me.off = function(name, callback) {
    if (typeof name === 'undefined') throw new Error('Cannot remove a listener of an undefined event');
    var index = Me._triggerListeners[name].indexOf(callback);
    if (index > -1) {
      Me._triggerListeners[name].splice(index, 1);
    }
}

Me.trigger = function(name, params) {
    //window.console.log('CaffeineEventDispatcher - triggering ' + name);
    if (typeof name === 'undefined') throw new Error('Cannot trigger undefined event');
    if (!Me._triggerListeners[name]) return;

    var callbacks = Me._triggerListeners[name].slice(0); // Clone the listeners so that if a callback calls the `off` method, the forloop below will continue to function
    for (var i=0; i<callbacks.length; i++) {
        callbacks[i].call(global, params);
    }
}


function debug(obj, prefix) {

  if (typeof obj === 'string') {
    global.log(obj);
    return;
  }

  if (typeof obj === 'object') {
    if (!prefix) prefix = '';
    if (prefix.length > 10) return;
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
