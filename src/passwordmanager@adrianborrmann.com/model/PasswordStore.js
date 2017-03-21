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
        let homePath = GLib.get_home_dir();
        let [result, out, err, status] = GLib.spawn_command_line_sync("tree -J " + homePath + "/.password-store");

        err = String(err);

        if (err.length > 0) {
            global.log(err);
            return [String(err)]
        }
        else {
            out = String(out);
            out = JSON.parse(out);
            out = this._formatOutputList(out);
            return out;
        }
    },

    edit: function(id) {

      debug('PasswordStore - editing ' + id);
      this._spawn(['pass', 'edit', id]);
    },

    getPassword: function(id) {

        // TODO: this could be hijacked by a cleverly named file in the password store?
        //var res = Util.spawn(['pass', '-c', id]);
        this._spawn(['pass', '-c', id]);
        //Util.spawn(['notify-send', '"hey ' + res + '"']);
    },

    getUsername: function(id) {

        debug('Getting USERNAME');
        let [result, out, err, status] = GLib.spawn_command_line_sync("pass " + id);

        err = String(err);

        if (err.length > 0) {
            global.log(err);
            return [String(err)]
        }
        else {
            //out = String(out);
            //out = JSON.parse(out);
            //out = this._formatOutputList(out);
            return 'test user';
        }
    },

    match: function(searchList) {

      debug('PasswordStore.match');
      let matches = [];
      let passwords = this.getList();
      for (let i=0; i<passwords.length; i++) {
        let password = passwords[i];
        let passwordName = password.name.toLowerCase();
        let passwordFolder = password.folder.toLowerCase();
        for (let j=0; j<searchList.length; j++) {
          let keyword = searchList[j];
          keyword = keyword.toLowerCase();

          if (keyword === passwordName) {
            matches.push(password);
            break;
          }
          if (
            keyword.indexOf(passwordName) > -1 ||
            passwordName.indexOf(keyword) > -1 ) {
            matches.push(password);
            break;
          }
          if (
            passwordFolder.length > 0 &&
            ( keyword.indexOf(passwordFolder) > -1 ||
              passwordFolder.indexOf(keyword) > -1)
            ) {
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

    _formatOutputList: function(output, folderName) {

      debug('PasswordStore._formatOutputList');

      if (folderName) {
        folderName = folderName + '/';
      }
      else {
        folderName = '';
      }

      var entries = [];
      output = output[0].contents;
      for (var i in output) {
        var entry = output[i];
        if (output.hasOwnProperty(i) && typeof entry === 'object') {
          if (entry.type == 'file') {
            // Only count .gpg files!
            if (entry.name.indexOf('.gpg') === entry.name.length-4) {
              entry.name = entry.name.substring(0, entry.name.length-4);
              entry.folder = folderName;
              entries.push(entry);
            }
          }
          else if (entry.type == 'directory') {
            let newEntries = this._formatOutputList([entry], folderName + entry.name);
            for (var i in newEntries) {
              entries.push(newEntries[i]);
            }
          }
        } 
      }

      return entries;
    },

/*
    OLD STYLE FORMAT (using just "pass" command to generate output)
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
*/


    _spawn: function(argv) {

      var env = GLib.get_environ();
      env = GLib.environ_setenv(env, 'EDITOR', 'gedit', true);


      var success, pid;
      try {
          [success, pid] = GLib.spawn_async(
            null,
            argv,
            env,
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
