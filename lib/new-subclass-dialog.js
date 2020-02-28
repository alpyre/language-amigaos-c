const {TextEditor, CompositeDisposable, Disposable} = require('atom');
const path = require('path');
const fs = require('fs');
const ui = require('./dialog-utilities');
const types = ['BOOPSI', 'MUI'];
const names = ['GROUPGCLASS', 'MUIC_Group'];

module.exports = class New_SubClass_Dialog {
  constructor(directory) {
    this.directory = directory;
    this.prjDir = atom.project.getPaths()[0];
    this.mainFile = this.findNearest('main.c');
    this.makeFile = this.findNearest('makefile');
    this.disposables = new CompositeDisposable();
    this.element = document.createElement('div');
      this.element.classList.add('new-amiga-subclass-dialog');

      // Title
      ui.newLabel(this.element, 'Create New Amiga Subclass', 'h1');

      // Subclass Name
      ui.newLabel(this.element, 'Name', 'h2');
      ui.newLabel(this.element, 'Will be used as source and header filenames:');
      this.nameEditor = ui.newString(this.element, this.disposables, null, 1, false);
        this.disposables.add(this.nameEditor.onDidChange(() => this.showError()));

      // Superclass
      ui.newLabel(this.element, 'Superclass', 'h2');
      ui.newLabel(this.element, 'Superclass identifier that this subclass will inherit:');
      var gui = atom.config.get('language-amigaos-c.highlightPrefs.GUI');
      var className;
      if (gui == "MUI" || gui == "MUI (with shortcut macros)") className = names[1];
      else className = names[0];
      this.superEditor = ui.newString(this.element, this.disposables, className, 2, false);

      // Class Type
      ui.newLabel(this.element, 'Type', 'h2', true);
      this.slcType = ui.newSelector(this.element, 'Class type for this subclass:', types, 3);
      if (gui == "MUI" || gui == "MUI (with shortcut macros)") this.slcType.selectedIndex = 1;
      else this.slcType.selectedIndex = 0;
      this.slcType.addEventListener('change', () => {
        this.superEditor.setText(names[this.slcType.selectedIndex]);
      });

      // options
      this.chkUpdMain = ui.newCheckBox(this.element, 'Update main.c', !this.mainFile, this.mainFile, 4);
      this.chkUpdMake = ui.newCheckBox(this.element, 'Update makefile', !this.makeFile, this.makeFile, 4);
      this.chkSTD = ui.newCheckBox(this.element, 'Include standard library headers', false, false, 5);
      this.chkSDI = ui.newCheckBox(this.element, 'Include SDI headers in project (OBLIGATORY for subclass code to compile)', false, true, 6);

      // Confirm/Cancel buttons
      var div = document.createElement('div');
        div.align = 'right';

        this.btnCreate = ui.newButton(div, 'Create', false, 7);
        this.btnCreate.addEventListener('click', () => {
          this.confirm();
        });

        const blurHandler = () => {
          if (document.hasFocus())
          { this.nameEditor.element.focus(); }
        };

        this.btnCancel = ui.newButton(div, 'Cancel', false, 8);
        this.btnCancel.addEventListener('blur', blurHandler);
        this.btnCancel.addEventListener('click', () => {
          this.close();
        });

      this.element.appendChild(div);

      // Error display
      this.errDiv = document.createElement('div');
        this.errDiv.classList.add('err-message');
        this.element.appendChild(this.errDiv);

      atom.commands.add(this.element, {
        'core:confirm': () => {
          this.confirm();
        },
        'core:cancel': () => this.cancel()
      });
  }

  attach() {
    this.panel = atom.workspace.addModalPanel({item: this, autoFocus: true});
    this.nameEditor.element.focus();
  }

  close() {
    var panel = this.panel;
    this.panel = null;
    if (panel != null) {
      panel.destroy();
    }
    this.disposables.dispose();
    const activePane = atom.workspace.getCenter().getActivePane();
    if (!activePane.isDestroyed()) { activePane.activate(); }
  }

  showError(message) {
    if (message == null) { message = ''; }
    this.errDiv.textContent = message;
  }

  cancel() {
    this.close();
  }

  confirm() {
    var name = this.nameEditor.getText();
    // check if file name is a valid file name:
    if (name.length == 0) {
      this.showError("Please enter a name for the new subclass!");
      this.nameEditor.element.focus();
      return;
    }
    if (name.match("[\.,\\\/\"\'#?\*%:|<> ]")) {
      this.showError("Subclass name contains invalid characters!");
      this.nameEditor.element.focus();
      return;
    }

    // Check if there already are such files
    var fileNameC = name.toLowerCase() + '.c';
    var fileNameH = name.toLowerCase() + '.h';
    if (this.searchFile(this.prjDir, [fileNameC, fileNameH])) {
      this.showError("Such a class already exists in your project!");
      this.nameEditor.element.focus();
      return;
    }
    var fileC = path.join(this.directory, fileNameC);
    var fileH = path.join(this.directory, fileNameH);
    // if the user pressed enter on the name editor activate path editor
    if (this.nameEditor.element.hasFocus()) {
      this.superEditor.element.focus();
      return;
    }

    var supercl = this.superEditor.getText();
    // check if superclass name is a valid one:
    if (supercl.length == 0) {
      this.showError("Please enter a superclass identifier!");
      this.superEditor.element.focus();
      return;
    }
    if (supercl.match("[\.,\\\/\"\'#?\*%:|<>]")) {
      this.showError("Superclass identifier contains invalid characters!");
      this.superEditor.element.focus();
      return;
    }

    // create class identifier names
    if (this.slcType.value == 'MUI') {
      var ca_name = 'MUIA_' + name;
      var cm_name = 'MUIM_' + name;
      var cl_creator = 'struct MUI_CustomClass* MUI_Create_' + name.replace(/-/g, '_') + '(void)';
    }
    else {
      var ca_name = name;
      var cm_name = name;
      var cl_creator = 'struct IClass* Create_' + name.replace(/-/g, '_') + '(void)';
    }

    // Read the class templates
    var codesDir = path.resolve(__dirname, '..', './data/codes');
    var splitStr = "/*SPLIT*/";
    var header = this.createSubclassHeader(name);
    var base = fs.readFileSync(path.join(codesDir, 'subclass.c'), 'utf8', (err, data) => {}).split(splitStr);
    var std = fs.readFileSync(path.join(codesDir, 'std-headers.c'), 'utf8', (err, data) => {});

    // create the class code
    var code = header + base[1];
    if (this.chkSTD.checked) code += std;
    code += base[2];
    if (this.slcType.value == 'MUI') code += base[3];
    code += base[4] + name.toLowerCase() + base[5];
    code += this.createClassCreator(name, supercl, cl_creator);

    // Write the subclass code to .c file
    fs.writeFileSync(fileC, code, 'utf8');

    // create the class header file
    base = fs.readFileSync(path.join(codesDir, 'subclass.h'), 'utf8', (err, data) => {}).split(splitStr);
    code = header + base[1];
    code += ca_name + base[2] + cm_name + base[3];
    code += cl_creator + ';' + base[4];
    if (this.slcType.value == 'MUI') code += base[5];

    // write the subclass .h file
    fs.writeFileSync(fileH, code, 'utf8');

    // include this header in project main.c
    if (this.chkUpdMain.checked) {
      code = fs.readFileSync(this.mainFile, 'utf8', (err, data) => {});
      var rep = '#include "' + path.relative(path.dirname(this.mainFile), fileH) + '"\n';
      if (code.search('"\n///\n///structures') == -1) rep = '\n' + rep;
      code = this.insert(rep, '///\n///structures', code);
      if (code) fs.writeFileSync(this.mainFile, code, 'utf8');
    }

    // add recipes for this new class object in makefile
    if (this.chkUpdMake.checked) {
      code = fs.readFileSync(this.makeFile, 'utf8', (err, data) => {});
      var objName = fileNameH.replace('.h', '.o');
      var relPath = path.relative(path.dirname(this.makeFile), fileC);
      // add class .o to OBJS list
      rep = 'OBJS = ' + objName + ' ';
      code = code.replace(/OBJS = /g, rep);
      // set includes directory for SDI headers if not
      if (this.chkSDI.checked && code.search(/\nIDIRS =.*-Iincludes/) == -1) {
        var loc = code.search('\nIDIRS =');
        if (loc != -1) {
          loc += 8;
          code = code.substr(0, loc) + ' -Iincludes' + code.substr(loc, code.length);
        }
        else code = null;
      }
      // add a new recipe for class .o
      if (code) {
        rep = '\n' + objName + ' : ' + relPath + '\n	$(CC) -c $< $(CFLAGS)\n';
        code = this.insert(rep, /\n\$\(EXE\) :/, code);
        if (code) fs.writeFileSync(this.makeFile, code, 'utf8');
      }
    }

    // create the includes directory if not present
    if (this.chkSDI.checked) {
      var inclFolder = path.join(this.prjDir, 'includes');
      if (!fs.existsSync(inclFolder)) fs.mkdirSync(inclFolder);
      if (fs.existsSync(inclFolder)) {
        // copy SDI-Headers
        var sdiDir = path.join(codesDir, 'SDI');
        var files = fs.readdirSync(sdiDir);
        var file;
        var maxi = files.length;
        for (var i = 0; i < maxi; i++) {
          file = path.join(inclFolder, files[i]);
          if (!fs.existsSync(file))
            fs.copyFileSync(path.join(sdiDir, files[i]), file);
        }

        file = path.join(inclFolder, 'readme.md');
        if (!fs.existsSync(file))
          fs.writeFileSync(file,
          'For more information on SDI-headers refer to:\nhttp://aminet.net/package/dev/c/SDI_headers', 'utf8');
      }

    }

    atom.open({pathsToOpen: [fileC]});

    this.close();
  }

  createSubclassHeader(name) {
    var header = '/';
    for (var i = 0; i < 78; i++) { header += '*'; }
    header += '\n * ';
    header += name;
    for (var i = 0; i < (75-name.length); i++) { header += ' '; }
    header += '*\n ';
    for (var i = 0; i < 78; i++) { header += '*'; }
    header += '/';

    return header;
  }

  createClassCreator(name, superName, creator) {
    var string = '///Class Creator\n';
    if (this.slcType.value == 'MUI') {
      string += creator + '\n{\n';
      string += '    return (MUI_CreateCustomClass(NULL, ' + superName;
      string += ', NULL, sizeof(struct cl_Data), ENTRY(cl_Dispatcher)));\n}\n///\n';
    }
    else {
      string += creator + '\n{\n';
      string += '  struct IClass* cl = MakeClass(NULL, ' + superName;
      string += ', NULL, sizeof(struct cl_Data), NULL);\n';
      string += '  cl->cl_Dispatcher.h_Entry = ENTRY(cl_Dispatcher);\n';
      string += '  cl->cl_Dispatcher.h_SubEntry = cl_Dispatcher;\n';
      string += '  return (cl);\n}\n///\n';
    }
    return string;
  }

  findNearest(file) {
    var dir = this.directory;
    var found = false;
    var fPath;
    while (true) {
      fPath = path.join(dir, file);
      if (fs.existsSync(fPath)) { found = true; break; }
      if (dir == this.prjDir) break;
      dir = path.dirname(dir);
    }

    if (!found) fPath = null;
    return fPath;
  }

  insert(str, at, to) {
    var loc = to.search(at);
    if (loc == -1) return null;
    return (to.substr(0, loc) + str + to.substr(loc, to.length));
  }

  searchFile(dir, files) {
    var found = false;
    var filePath;
    var stat;
    var contents = fs.readdirSync(dir);
    var maxi = contents.length;
    for (var i = 0; i < maxi; i++) {
      filePath = path.join(dir, contents[i]);
      stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) found = this.searchFile(filePath, files);
      else {
        var maxl = files.length;
        for (var l = 0; l < maxl; l++) {
          if (contents[i] == files[l]) { found = true; break; }
        }
      }
      if (found) break;
    }
    return found;
  }
};
