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

        //let [result, out, err, status] = GLib.spawn_command_line_sync('pass');
        let [result, out, err, status] = GLib.spawn_command_line_sync("pass");

        err = String(err);

        if (err.length > 0) {
            global.log(err);
            return [String(err)]
        }
        else {
            out = this._formatOutputList(out);
            return out;
        }
    },

    getPassword: function(id) {

        // TODO: this could be hijacked by a cleverly named file in the password store?
        //var res = Util.spawn(['pass', '-c', id]);
        this._spawn(['pass', '-c', id]);
        //Util.spawn(['notify-send', '"hey ' + res + '"']);
    },

    match: function(searchList) {

      debug('PasswordStore.match');
      let matches = [];
      let passwords = this.getList();
      for (let i=0; i<passwords.length; i++) {
        let password = passwords[i];
        for (let j=0; j<searchList.length; j++) {
          let keyword = searchList[j];
          //debug(keyword + ' vs ' + password);
          if (
            keyword.toLowerCase().indexOf(password.toLowerCase()) > -1 ||
            password.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
            matches.push(password);
            break;
          }
        }
      }

      //debug(passwords);
      //debug(searchList);

      //debug(matches);
      return matches;
    },

    _formatOutputList: function(output) {


        output = String(output).trim();
        output = output.split('\n');
        output.shift(); // Remove "Password Store" header

        // remove non-printable characters
        for (let i=0; i<output.length; i++) {
          output[i] = output[i].replace(/[├─└]+/g, ''); // remove characters added by "tree"
          output[i] = output[i].replace('\\ ', ' ', 'g'); // remove escaped spaces
          output[i] = output[i].replace(/[^\x20-\x7E]+/g, ''); // remove characters related to terminal colours
          output[i] = output[i].trim();

        }
        
        debug(output);
        return output;
    },


    _spawn: function(argv) {
      var success, pid;
      try {
          [success, pid] = GLib.spawn_async(
            null,
            argv,
            null,
            GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
            null
          );
      } catch (err) {
          /* Rewrite the error in case of ENOENT */
          if (err.matches(GLib.SpawnError, GLib.SpawnError.NOENT)) {
              throw new GLib.SpawnError({
                code: GLib.SpawnError.NOENT,
                message: _("Command not found")
              });
          } 
          else if (err instanceof GLib.Error) {
              // The exception from gjs contains an error string like:
              //   Error invoking GLib.spawn_command_line_async: Failed to
              //   execute child process "foo" (No such file or directory)
              // We are only interested in the part in the parentheses. (And
              // we can't pattern match the text, since it gets localized.)
              let message = err.message.replace(/.*\((.+)\)/, '$1');
              throw new (err.constructor)({
                code: err.code,
                message: message
              });
          } else {
              throw err;
          }
      }

      // Dummy child watch; we don't want to double-fork internally
      // because then we lose the parent-child relationship, which
      // can break polkit.  See https://bugzilla.redhat.com//show_bug.cgi?id=819275
      //GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function () {
      //  debug(pid);
      //  //Util.trySpawn(['notify-send', '-i', 'dialog-password-symbolic', '-t', '8000', 'Password copied']);
      //});

      GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function(pid, condition, data) {
        var message = 'Password copied'
        if(condition) {
          message = 'There was a problem accessing your password'
        }
        Util.trySpawn([
          'notify-send',
          '-i', 'dialog-password-symbolic',
          '-t', '8000',
          message
        ]);
        //debug(GLib);
        //debug(GLib.check_exit_status(condition));
      });




/*
        try {
            Util.trySpawn(argv);
            //Util.trySpawn(['notify-send', '-i', 'dialog-password-symbolic', '-t', '8000', 'Password copied']);
        } catch (err) {
            Util.spawn(['notify-send', '"' + err.message + '"']);
        }
*/
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
