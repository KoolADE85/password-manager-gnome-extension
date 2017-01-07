const Lang = imports.lang;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Gdk = imports.gi.Gdk;

const PasswordStore = new Lang.Class({
    Name: 'PasswordStore',

    _init: function() {

        debug('PasswordStore._init');

    },

    getList: function(callback) {

        debug('PasswordStore.getList');

        let [result, out, err, status] = GLib.spawn_command_line_sync('pass');

        err = String(err);

        if (err.length > 0) {
            global.log(typeof err);
            return [String(err)]
        }
        else {
            out = this._formatOutputList(out);
            return out;
        }
    },

    getPassword: function(id) {

        // TODO: this could be hijacked by a cleverly named file in the password store?
        Util.spawn(['pass', '-c', id]);
    },

    match: function(searchList) {

      debug('PasswordStore.match');
      let matches = [];
      let passwords = this.getList();
      for (let i=0; i<passwords.length; i++) {
        let password = passwords[i];
        for (let j=0; j<searchList.length; j++) {
          let windowTitle = searchList[j].toLowerCase();
          //debug(windowTitle + ' vs ' + password);
          if (windowTitle.indexOf(password.toLowerCase()) > -1) {
            matches.push(password);
            break;
          }
        }
      }

      debug(passwords);
      debug(searchList);

      debug(matches);
      return matches;
    },

    _formatOutputList: function(output) {

        output = String(output).trim();
        output = output.split('\n');
        output.shift(); // Remove "Password Store" header

        // remove non-printable characters
        for (let i=0; i<output.length; i++) {
            output[i] = output[i].replace(/[^\x20-\x7E]+/g, '');
            output[i] = output[i].trim();
        }
        
        return output;
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
