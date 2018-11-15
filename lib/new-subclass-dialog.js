const {TextEditor, CompositeDisposable, Disposable} = require('atom');
const path = require('path');
const fs = require('fs');
const types = ['BOOPSI', 'MUI'];

module.exports = class New_SubClass_Dialog {
  constructor(directory) {
    this.directory = directory;
    this.prjDir = atom.project.getPaths()[0];
    this.disposables = new CompositeDisposable();
    this.element = document.createElement('div');
      this.element.classList.add('new-amiga-subclass-dialog');

      // Title
      var label = document.createElement('h1');
        label.textContent = "Create New Amiga Subclass";
        this.element.appendChild(label);

      // Subclass Name
      label = document.createElement('h2');
        label.textContent = "Name";
        label.style.paddingBottom = '0px';
        label.style.marginBottom = '2px';
        this.element.appendChild(label);

      label = document.createElement('label');
        label.textContent = 'Will be used as source and header filenames:';
        this.element.appendChild(label);

      this.nameEditor = new TextEditor({mini: true});
        this.disposables.add(this.nameEditor.onDidChange(() => this.showError()));
        this.disposables.add(new Disposable(() => this.nameEditor.destroy()));
        this.nameEditor.element.tabIndex = '1';
        this.element.appendChild(this.nameEditor.element);

      // Superclass
      label = document.createElement('h2');
        label.textContent = "Superclass";
        label.style.paddingBottom = '0px';
        label.style.marginBottom = '2px';
        this.element.appendChild(label);

      label = document.createElement('label');
        label.textContent = 'Superclass identifier that this subclass will inherit:';
        this.element.appendChild(label);

      this.superEditor = new TextEditor({mini: true});
        var gui = atom.config.get('language-amigaos-c.highlightPrefs.GUI');
        if (gui == "MUI" || gui == "MUI (with shortcut macros)")
          this.superEditor.setText('MUIC_Group');
        else
          this.superEditor.setText('GROUPGCLASS');
        this.disposables.add(this.superEditor.onDidChange(() => this.showError()));
        this.disposables.add(new Disposable(() => this.superEditor.destroy()));
        this.superEditor.element.tabIndex = '2';
        this.element.appendChild(this.superEditor.element);

      // Class Type
      label = document.createElement('h2');
        label.textContent = "Type";
        label.style.padding = '0px';
        label.style.marginTop = '2px';
        label.style.marginBottom = '2px';
        this.element.appendChild(label);

      var fragment = document.createDocumentFragment();
        label = document.createElement('label');
          label.classList.add('control-label');

        var div = document.createElement('div');
          div.classList.add('setting-title');
          div.textContent = "Class type for this subclass:";
          label.appendChild(div);

        fragment.appendChild(label)

        this.slcType = document.createElement('select');
          this.slcType.tabIndex = '3';
          this.slcType.classList.add('form-control');
          for (var i = 0; i < types.length; i++)
          {
            var optionElement = document.createElement('option');
              optionElement.value = types[i];
              optionElement.textContent = types[i];
              this.slcType.appendChild(optionElement);
          }
          if (gui == "MUI" || gui == "MUI (with shortcut macros)")
            this.slcType.selectedIndex = 1;
          else
            this.slcType.selectedIndex = 0;
          this.slcType.addEventListener('change', () => {
            if (this.slcType.value == 'MUI')
              this.superEditor.setText('MUIC_Group');
            else
              this.superEditor.setText('GROUPGCLASS');
          });
        fragment.appendChild(this.slcType);
      this.element.appendChild(fragment);

      // update main.c and makefile
      this.chkUpdate = this.newCheckBox('Update main.c and makefile', false, true, 4);

      // standard c libraries
      this.chkSTD = this.newCheckBox('Include standard library headers', false, false, 5);

      // SDI Headers
      this.chkSDI = this.newCheckBox('SDI headers are obligatory for subclass code (will require SDI headers in project includes directory)', true, true, 6);

      // Confirm/Cancel buttons
      this.btnCreate = document.createElement('button');
        this.btnCreate.style.color = 'DimGrey';
        this.btnCreate.textContent = "Create";
        this.btnCreate.tabIndex = '7';
        this.btnCreate.addEventListener('click', () => {
          this.confirm();
        });

      const blurHandler = () => {
        if (document.hasFocus())
        { this.nameEditor.element.focus(); }
      };

      this.btnCancel = document.createElement('button');
        this.btnCancel.style.color = 'DimGrey';
        this.btnCancel.textContent = "Cancel";
        this.btnCancel.tabIndex = '8';
        this.btnCancel.addEventListener('blur', blurHandler);
        this.btnCancel.addEventListener('click', () => {
          this.close();
        });

      div = document.createElement('div');
        div.align = 'right'
        div.appendChild(this.btnCreate);
        div.appendChild(this.btnCancel);
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
    var fileNameC = path.join(this.directory, name.toLowerCase() + '.c');
    var fileNameH = path.join(this.directory, name.toLowerCase() + '.h');
    if (fs.existsSync(fileNameC) || fs.existsSync(fileNameH)) {
      this.showError("Such a class already exists in your project!");
      this.nameEditor.element.focus();
      return;
    }
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
      var cl_creator = 'struct MUI_CustomClass* MUI_Create_' + name.replace(/-/g, '_') + '(void)'
    }
    else {
      var ca_name = name;
      var cm_name = name;
      var cl_creator = 'struct IClass* Create_' + name.replace(/-/g, '_') + '(void)'
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
    fs.writeFileSync(fileNameC, code, 'utf8');

    // create the class header file
    base = fs.readFileSync(path.join(codesDir, 'subclass.h'), 'utf8', (err, data) => {}).split(splitStr);
    code = header + base[1];
    code += ca_name + base[2] + cm_name + base[3];
    code += cl_creator + ';' + base[4];
    if (this.slcType.value == 'MUI') code += base[5];

    // write the subclass .h file
    fs.writeFileSync(fileNameH, code, 'utf8');

    if (this.chkUpdate.checked) {
      // include this header in project main.c
      var mainFile = this.findNearest('main.c');
      if (mainFile) {
        code = fs.readFileSync(mainFile, 'utf8', (err, data) => {});
        var rep = '#include "' + path.relative(path.dirname(mainFile), fileNameH) + '"\n';
        if (code.search('"\n///\n///structures') == -1) rep = '\n' + rep;
        code = this.insert(rep, '///\n///structures', code);
        if (code) fs.writeFileSync(mainFile, code, 'utf8');
      }

      // add recipes for this new class object in makefile
      var makeFile = this.findNearest('makefile');
      if (makeFile) {
        code = fs.readFileSync(makeFile, 'utf8', (err, data) => {});
        var objName = path.basename(fileNameH).replace('.h', '.o');
        var relPath = path.relative(path.dirname(makeFile), fileNameC);
        // add class .o to OBJS list
        rep = 'OBJS = ' + objName + ' ';
        code = code.replace(/OBJS = /g, rep);
        // set includes directory for SDI headers if not
        if (code.search(/\nIDIRS =.*-Iincludes/) == -1) {
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
          if (code) fs.writeFileSync(makeFile, code, 'utf8');
        }
      }
    }

    // create the includes directory if not present
    var inclFolder = path.join(this.prjDir, 'includes');
    if (!fs.existsSync(inclFolder)) {
      fs.mkdirSync(inclFolder);
      if (fs.existsSync(inclFolder)) {
        // copy SDI-Headers
        var sdiDir = path.join(codesDir, 'SDI');
        var files = fs.readdirSync(sdiDir);
        for (var i = 0; i < files.length; i++)
          fs.copyFileSync(path.join(sdiDir, files[i]), path.join(inclFolder, files[i]));

        fs.writeFileSync(path.join(inclFolder, 'readme.md'),
        'For more information on SDI-headers refer to:\nhttp://aminet.net/package/dev/c/SDI_headers', 'utf8');
      }
    }

    atom.open({pathsToOpen: [fileNameC]});

    this.close();
  }

  createSubclassHeader(name) {
    var header = '/';
    for (var i = 0; i<78; i++) { header += '*'; }
    header += '\n * ';
    header += name;
    for (var i = 0; i<(75-name.length); i++) { header += ' '; }
    header += '*\n ';
    for (var i = 0; i<78; i++) { header += '*'; }
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

  newCheckBox(text, disabled, checked, tabIndex) {
    var div = document.createElement('div');
      div.classList.add('checkbox');
      var label = document.createElement('label');
        var checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.checked = checked;
        checkBox.disabled = disabled;
        checkBox.classList.add('input-checkbox');
        checkBox.tabIndex = tabIndex;
      label.appendChild(checkBox);
        var title = document.createElement('div');
        title.classList.add('setting-title');
        if (disabled) title.style.color = 'DimGrey';
        title.textContent = text;
        label.appendChild(title);
      div.appendChild(label);
    this.element.appendChild(div);

    return checkBox;
  }
};
