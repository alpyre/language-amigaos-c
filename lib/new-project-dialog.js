const {TextEditor, CompositeDisposable, Disposable} = require('atom');
const path = require('path');
const dialog = require('electron').remote.dialog;
const fs = require('fs');
const os = require('os');
const types = ['Amiga', 'Reaction', 'MUI'];

module.exports = class New_Project_Dialog {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.element = document.createElement('div');
      this.element.classList.add('new-amiga-project-dialog');

      // Title
      var label = document.createElement('h1');
        label.textContent = "Create New Amiga Project";
        this.element.appendChild(label);

      // Project Name
      label = document.createElement('h2');
        label.textContent = "Name";
        label.style.paddingBottom = '0px';
        label.style.marginBottom = '2px';
        this.element.appendChild(label);

      label = document.createElement('label');
        label.textContent = "Enter a name for your project (will also be used as the executable name):";
        this.element.appendChild(label);

      this.nameEditor = new TextEditor({mini: true});
        this.disposables.add(this.nameEditor.onDidChange(() => this.showError()));
        this.disposables.add(new Disposable(() => this.nameEditor.destroy()));
        this.nameEditor.element.tabIndex = '1';
        this.element.appendChild(this.nameEditor.element);

      // Project Directory
      label = document.createElement('h2');
        label.textContent = "Directory";
        label.style.paddingBottom = '0px';
        label.style.marginBottom = '2px';
        this.element.appendChild(label);

      label = document.createElement('label');
        label.textContent = "Directory to create the project folder (a new folder with the project name will be created):";
        this.element.appendChild(label);

      this.pathEditor = new TextEditor({mini: true, readOnly: true});
        this.disposables.add(new Disposable(() => this.pathEditor.destroy()));
        this.pathEditor.setText(os.homedir(), {bypassReadOnly: true});
        this.disposables.add(this.pathEditor.onDidChange(() => this.showError()));
        this.pathEditor.element.tabIndex = '2';
        this.pathEditor.element.style.flex = '100';

      this.pathButton = document.createElement('button');
        this.pathButton.type = 'button';
        this.pathButton.style.display = 'inline';
        this.pathButton.style.color = 'grey';
        this.pathButton.style.fontSize = 'small';
        this.pathButton.style.height = '29px';
        this.pathButton.style.width = '32px';
        this.pathButton.classList.add('icon');
        this.pathButton.classList.add('icon-search');
        this.pathButton.tabIndex = '3';
        this.pathButton.addEventListener('click', () => {
          dialog.showOpenDialog({defaultPath: this.pathEditor.getText(), properties:['openDirectory']}, (fileNames) => {
            if (fileNames === undefined) return;
            this.pathEditor.setText(fileNames[0], {bypassReadOnly: true});
          });
          this.pathEditor.element.focus();
        });

      var div = document.createElement('div');
        div.style.display = 'flex';
        div.appendChild(this.pathEditor.element);
        div.appendChild(this.pathButton);
        this.element.appendChild(div);

      // Code Type
      label = document.createElement('h2');
        label.textContent = "Type";
        label.style.padding = '0px';
        label.style.marginTop = '2px';
        label.style.marginBottom = '2px';
        this.element.appendChild(label);

      var fragment = document.createDocumentFragment();
        label = document.createElement('label');
          label.classList.add('control-label');

        div = document.createElement('div');
          div.classList.add('setting-title');
          div.textContent = "Select code type for this project:";
          label.appendChild(div);

        fragment.appendChild(label)

        this.slcType = document.createElement('select');
          this.slcType.tabIndex = '4';
          this.slcType.classList.add('form-control');
          for (var i = 0; i < types.length; i++)
          {
            var optionElement = document.createElement('option');
              optionElement.value = types[i];
              optionElement.textContent = types[i];
              this.slcType.appendChild(optionElement);
          }
          if (atom.config.get('language-amigaos-c.highlightPrefs.GUI')  == "none")
            this.slcType.selectedIndex = 0;
          else if (atom.config.get('language-amigaos-c.highlightPrefs.GUI') == "Reaction")
            this.slcType.selectedIndex = 1;
          else
            this.slcType.selectedIndex = 2;
        fragment.appendChild(this.slcType);
      this.element.appendChild(fragment);

      // standard c libraries
      div = document.createElement('div');
        div.classList.add('checkbox');
        label = document.createElement('label');
          this.chkSTD = document.createElement('input');
          this.chkSTD.type = 'checkbox';
          this.chkSTD.classList.add('input-checkbox');
          this.chkSTD.tabIndex = '5';
        label.appendChild(this.chkSTD);
          var title = document.createElement('div');
          title.classList.add('setting-title');
          title.textContent = "Include standard library headers";
          label.appendChild(title);
        div.appendChild(label);
      this.element.appendChild(div);

      // SDI Headers
      div = document.createElement('div');
        div.classList.add('checkbox');
        label = document.createElement('label');
          this.chkSDI = document.createElement('input');
          this.chkSDI.type = 'checkbox';
          this.chkSDI.classList.add('input-checkbox');
          this.chkSDI.tabIndex = '6';
        label.appendChild(this.chkSDI);
          title = document.createElement('div');
          title.classList.add('setting-title');
          title.textContent = "Include SDI headers (will require SDI headers in project includes directory)";
          label.appendChild(title);
        div.appendChild(label);
      this.element.appendChild(div);

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
