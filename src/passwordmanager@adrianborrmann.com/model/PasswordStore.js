const Lang = imports.lang;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gdk = imports.gi.Gdk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Fuse = Me.imports.lib.Fuse;
const St = imports.gi.St;
const Main = imports.ui.main;

const PasswordStore = new Lang.Class({
    Name: 'PasswordStore',

    _init: function() {

        debug('PasswordStore._init');

        var stdout = 'hi from passwordstore :)';
        

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

        debug('Getting PASSWORD');
        // TODO: this could be hijacked by a cleverly named file in the password store?
        //var res = Util.spawn(['pass', '-c', id]);
        this.getUsername(id);
        this._spawn(['pass', '-c', id], function(stdout, stderr) {
          debug('Got PASSWORD');
          if (stderr.length > 0) {
            this._notify(stderr);
          }
          else {
            this._notify(stdout);
          }
        });
        //Util.spawn(['notify-send', '"hey ' + res + '"']);
    },

    getUsername: function(id) {

        debug('Getting USERNAME');
        this._spawn(['pass', id], function(output, error) {

          if (error) return;

          debug('Got USERNAME');
          let lines = output.split('\n');
          for (var i in lines) {
            var line = lines[i].toLowerCase();
            if (line.substring(0,5) === 'user:') {
              var username = line.substring(5).trim();
              St.Clipboard.get_default().set_text(St.ClipboardType.PRIMARY, username);
              //this._notify('Copied username \"' + username + '\" to clipboard.');
              return;
            }
            if (line.substring(0,9) === 'username:') {
              var username = line.substring(9).trim();
              St.Clipboard.get_default().set_text(St.ClipboardType.PRIMARY, username);
              //this._notify('Copied username \"' + username + '\" to clipboard.');
              return;
            }            else if (line.substring(0,6) === 'login:') {
              var username = line.substring(6).trim();
              St.Clipboard.get_default().set_text(St.ClipboardType.PRIMARY, username);
              //this._notify('Copied username \"' + username + '\" to clipboard.');
              return;
            }          }

          this._notify('Username not found for ' + id);

          
        });
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
          if (keyword.length < 2) break;
          //debug('Searching for "' + keyword + '" in "' + passwordName + '"');

          if (passwordName.indexOf(keyword) > -1) {
            matches.push(password);
            break;
          }

          if (keyword.indexOf(passwordName) > -1) {
            matches.push(password);
            break;
          }
          
          if (passwordFolder.length > 0 && passwordFolder.indexOf(keyword) > -1) {
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

      //debug('PasswordStore._formatOutputList');

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


    _spawn: function(argv, callback) {

      var env = GLib.get_environ();
      env = GLib.environ_setenv(env, 'EDITOR', 'gedit', true);

      //argv = ['/bin/ls'];

      var success, pid;
      try {
          [success, pid, in_fd, out_fd, err_fd] = GLib.spawn_async_with_pipes(
            null,
            argv,
            env,
            GLib.SpawnFlags.SEARCH_PATH_FROM_ENVP | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
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

      var _this = this;
      var processFinished = false;
      var stdoutFinished = false;
      var stdErrFinished = false;

      var stdout = '';
      var stderr = '';
      const out_reader = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({fd: out_fd})
      });
      const err_reader = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({fd: err_fd})
      });

      function _StdOutRead(source_object, res){
        const [out, length] = out_reader.read_upto_finish(res);
        //if (length > 0) {
        if (!processFinished) {
          if (out) stdout += out + '\n';
          out_reader.read_upto_async("", 0, 0, null, _StdOutRead, "");
        } else {
          debug('  Spawn done reading output!');
          stdoutFinished = true;
          //finishProcess();
        } 
      } 
      function _StdErrRead(source_object, res){
        const [err, length] = err_reader.read_upto_finish(res);
        //if (length > 0) {
        if (!processFinished) {
          if (err) stderr += err + '\n';
          err_reader.read_upto_async("", 0, 0, null, _StdErrRead, "");
        } else {
          debug('  Spawn done reading error!');
          stdErrFinished = true;
          //finishProcess();
        } 
      } 
      out_reader.read_upto_async("", 0, 0, null, _StdOutRead, "");
      err_reader.read_upto_async("", 0, 0, null, _StdErrRead, "");

      GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function(pid, condition, data) {

        debug('  Spawn process finished');
        processFinished = true;
        finishProcess();
      });


      function finishProcess() {
        if (processFinished) {
          debug('  Spawn calling callback');
          GLib.spawn_close_pid(pid);
        }
        if (callback) {
          callback.call(_this, stdout, stderr);
        }
      }
    },

    _notify: function(msg) {

      Main.notify(msg);
    }
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
