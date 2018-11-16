const {TextEditor, CompositeDisposable, Disposable} = require('atom');
const path = require('path');
const ui = require('./dialog-utilities');
const fs = require('fs');
const os = require('os');
const types = ['Amiga', 'Reaction', 'MUI'];

module.exports = class New_Project_Dialog {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.element = document.createElement('div');
      this.element.classList.add('new-amiga-project-dialog');

      // Title
      ui.newLabel(this.element, 'Create New Amiga Project', 'h1');

      // Project Name
      ui.newLabel(this.element, 'Name', 'h2');
      ui.newLabel(this.element, 'Enter a name for your project (will also be used as the executable name):')
      this.nameEditor = ui.newString(this.element, this.disposables, null, 1, false);
        this.disposables.add(this.nameEditor.onDidChange(() => this.showError()));

      // Project Directory
      ui.newLabel(this.element, 'Directory', 'h2');
      ui.newLabel(this.element, 'Directory to create the project folder (a new folder with the project name will be created):')
      this.pathEditor = ui.newFileSelector(this.element, this.disposables, os.homedir(), 2, false, 'openDirectory');

      // Code Type
      ui.newLabel(this.element, 'Type', 'h2', true);
      this.slcType = ui.newSelector(this.element, 'Select code type for this project:', types, 0, 4);
      if (atom.config.get('language-amigaos-c.highlightPrefs.GUI')  == "none")
        this.slcType.selectedIndex = 0;
      else if (atom.config.get('language-amigaos-c.highlightPrefs.GUI') == "Reaction")
        this.slcType.selectedIndex = 1;
      else
        this.slcType.selectedIndex = 2;

      // options
      this.chkSTD = ui.newCheckBox(this.element, 'Include standard library headers', false, false, 5);
      this.chkSDI = ui.newCheckBox(this.element, 'Include SDI headers', false, false, 6);

      // Confirm/Cancel buttons
      var div = document.createElement('div');
        div.align = 'right'

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
    var prjName = this.nameEditor.getText();
    var prjDir = this.pathEditor.getText();
    var prjFolder = path.join(prjDir, prjName);
    // check if file name is a valid file name:
    if (prjName.length == 0) {
      this.showError("Please enter a project name!");
      this.nameEditor.element.focus();
      return;
    }
    if (prjName.match("[\.,\\\/\"\'#?\*%:|<>]")) {
      this.showError("Project name contains invalid characters!");
      this.nameEditor.element.focus();
      return;
    }

    // if the user pressed enter on the name editor activate path editor
    if (this.nameEditor.element.hasFocus()) {
      this.pathEditor.element.focus();
      return;
    }

    // check if path is valid
    if (prjDir.length == 0) {
      this.showError("Please enter project path!");
      this.pathEditor.element.focus();
      return;
    }
    if (!fs.existsSync(prjDir)) {
      this.showError("Project path does not exist!");
      this.pathEditor.element.focus();
      return;
    }
    if (fs.existsSync(prjFolder)) {
      this.showError("Project already exist!");
      this.pathEditor.element.focus();
      return;
    }

    // create the new project
    fs.mkdirSync(prjFolder);

    // Read the code templates
    var codesDir = path.resolve(__dirname, '..', './data/codes');
    var splitStr = "/*SPLIT*/";
    var header = this.createMainHeader(prjName);
    var base = fs.readFileSync(path.join(codesDir, 'base.c'), 'utf8', (err, data) => {}).split(splitStr);
    var std = fs.readFileSync(path.join(codesDir, 'std-headers.c'), 'utf8', (err, data) => {});

    // create the code string
    if (this.slcType.value == 'Reaction') {
      var ra_diffs = fs.readFileSync(path.join(codesDir, 'Reaction-diffs.c'), 'utf8', (err, data) => {}).split(splitStr);
      var code = header + base[1] + base[2] + base[3];
      if (this.chkSTD.checked) code += std;
      code += base[4] + ra_diffs[0];
      if (this.chkSDI.checked) code += fs.readFileSync(path.join(codesDir, 'SDI-headers.c'), 'utf8', (err, data) => {});
      code += base[5] + ra_diffs[1];
      code += base[6] + ra_diffs[2] + base[7] + ra_diffs[4] + base[8] + ra_diffs[5];
      code += base[9] + ra_diffs[3] + base[11];
    }
    else if (this.slcType.value == 'MUI') {
      var mui_diffs = fs.readFileSync(path.join(codesDir, 'MUI-diffs.c'), 'utf8', (err, data) => {}).split(splitStr);
      var code = header + base[1] + mui_diffs[0] + base[2] + mui_diffs[1] + base[3];
      if (this.chkSTD.checked) code += std;
      code += base[4] + mui_diffs[2];
      if (this.chkSDI.checked) code += fs.readFileSync(path.join(codesDir, 'SDI-headers.c'), 'utf8', (err, data) => {});
      code += base[5] + mui_diffs[3] + base[6] + mui_diffs[4] + base[7] + base[8] + base[9];
      code += mui_diffs[5] + base[11];
    }
    else {
      var code = header + base[1] + base[2] + base[3];
      if (this.chkSTD.checked) code += std;
      code += base[4];
      if (this.chkSDI.checked) code += fs.readFileSync(path.join(codesDir, 'SDI-headers.c'), 'utf8', (err, data) => {});
      code += base[5] + base[6] + base[7] + base[8] + base[9] + base[10] + base[11];
    }

    // Write the code to main.c file
    var mainFile = path.join(prjFolder, 'main.c');
    fs.writeFileSync(mainFile, code, 'utf8');

    // create the makefile
    var make = fs.readFileSync(path.join(codesDir, 'makefile'), 'utf8', (err, data) => {}).split('#SPLIT#');
    code = make[0];
    if (this.slcType.value != 'Reaction') code += make[1];
    code += '\n\nEXE = ' + prjName.replace(' ', '_') + make[3];
    if (this.slcType.value == 'Reaction') code += '\n  LFLAGS = -s -noixemul -lamiga -lreaction';
    else if (this.slcType.value == 'MUI') code += '\n  LFLAGS = -s -noixemul -lamiga -lmui';
    else code += make[4];
    code += make[5];
    if (this.slcType.value == 'Reaction') code += '\n  LFLAGS = -lauto -lraauto';
    else if (this.slcType.value == 'MUI') code += '\n  LFLAGS = -lauto';
    else code += make[6];
    code += make[7];
    if (this.slcType.value != 'Reaction') code += make[8];
    code += make[9];
    if (this.chkSDI.checked) code += '\nIDIRS = -Iincludes';
    else code += make[10];
    code += make[11];

    // write the makefile
    fs.writeFileSync(path.join(prjFolder, 'makefile'), code, 'utf8');

    // create the includes directory if user selected include SDI
    if (this.chkSDI.checked) {
      var inclFolder = path.join(prjFolder, 'includes');
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

    atom.open({pathsToOpen: [mainFile], newWindow: true});

    this.close();
  }

  createMainHeader(prjName) {
    var header = '/';
    for (var i = 0; i<78; i++) { header += '*'; }
    header += '\n * ';
    header += prjName;
    for (var i = 0; i<(75-prjName.length); i++) { header += ' '; }
    header += '*\n ';
    for (var i = 0; i<78; i++) { header += '*'; }
    header += '/\n\n///definitions\n#define PROGRAMNAME     "';
    header += prjName;
    header += '"';

    return header;
  }
};
