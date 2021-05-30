const {TextEditor, CompositeDisposable, Disposable} = require('atom');
const path = require('path');
const ui = require('./dialog-utilities');
const fs = require('fs');
const os = require('os');

module.exports = class New_Library_Dialog {
  constructor() {
    this.disposables = new CompositeDisposable();
    this.element = document.createElement('div');
      this.element.classList.add('new-amiga-library-dialog');

      // Title
      ui.newLabel(this.element, 'Create New Amiga Library', 'h1');

      // Library Name
      ui.newLabel(this.element, 'Name', 'h2');
      ui.newLabel(this.element, 'Enter a name for your library (use capitalization i.e: MyLibrary):');
      this.nameEditor = ui.newString(this.element, this.disposables, null, 1, false);
        this.disposables.add(this.nameEditor.onDidChange(() => this.showError()));

      // Project Directory
      var dir = atom.config.get('language-amigaos-c.newPrjPrefs.prjDir');
      if (!dir || !fs.existsSync(dir)) dir = os.homedir();
      ui.newLabel(this.element, 'Directory', 'h2');
      ui.newLabel(this.element, 'Directory to create the project folder (a new folder with the library name will be created):');
      this.pathEditor = ui.newFileSelector(this.element, this.disposables, dir, 2, false, 'openDirectory');

      // Library function protos input box
      ui.newLabel(this.element, 'Function prototypes', 'h2');
      ui.newLabel(this.element, 'Write your library function prototypes i.e: LONG myAdd(LONG num1, LONG num2);');
      this.protosEditor = ui.newEditor(this.element, this.disposables, null, 3, false, "source.c");
      this.SDKincludes = []; // two globals to extract includes from protosEditor
      this.LOCincludes = []; // ...I have no regrets for this "bad"(!) coding practice.
      ui.newLabel(this.element, 'NOTE: You can specify 68k registers if you need. i.e: LONG myAdd(REG(d0, LONG num1), LONG num2);');

      // options
      this.chkSTD      = ui.newCheckBox(this.element, 'Include standard library headers', false, false, 4);
      this.chkAutoDoc  = ui.newCheckBox(this.element, 'Create AutoDoc templates', false, true, 5);
      this.chkVecTable = ui.newCheckBox(this.element, 'Create 68k jump table (required if your library is to be opened by a 68k executable on OS4)', false, true, 6);
      this.chkXML      = ui.newCheckBox(this.element, 'Create .xml file', false, true, 7);

      // Confirm/Cancel buttons
      var div = document.createElement('div');
        div.align = 'right';

        this.btnCreate = ui.newButton(div, 'Create', false, 8);
        this.btnCreate.addEventListener('click', () => {
          this.confirm();
        });

        const blurHandler = () => {
          if (document.hasFocus())
          { this.nameEditor.element.focus(); }
        };

        this.btnCancel = ui.newButton(div, 'Cancel', false, 9);
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
    var protos = this.protosEditor.getText();
    // check if file name is a valid file name:
    if (prjName.length == 0) {
      this.showError("Please enter a library name!");
      this.nameEditor.element.focus();
      return;
    }
    if (prjName.match("[\.,\\\/\"\'#?\*%:|<>]")) {
      this.showError("Library name contains invalid characters!");
      this.nameEditor.element.focus();
      return;
    }
    if (!prjName.match("[A-Z]")) {
      this.showError("Please use proper capitalization!");
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
      this.showError("Please enter project directory for this library!");
      this.pathEditor.element.focus();
      return;
    }
    if (!fs.existsSync(prjDir)) {
      this.showError("Project directory does not exist!");
      this.pathEditor.element.focus();
      return;
    }
    if (fs.existsSync(prjFolder)) {
      this.showError("Project already exist!");
      this.pathEditor.element.focus();
      return;
    }
    // store this directory in settings
    atom.config.set('language-amigaos-c.newPrjPrefs.prjDir', prjDir);

    // if the user pressed enter on the path editor activate protos editor
    if (this.pathEditor.element.hasFocus()) {
        this.protosEditor.element.focus();
      return;
    }
    if (protos.length == 0) {
      this.showError("Please write your function prototypes!");
      this.protosEditor.element.focus();
      return;
    }

    // create the new project
    var prjname = prjName.toLowerCase();
    var PRJNAME = prjName.toUpperCase();
    var baseName = prjName + "Base";
    var iFacePtr = "I" + prjName;
    var iFaceName = prjName + "IFace";
    var makeAutoDoc = false;
    if (this.chkAutoDoc.checked) makeAutoDoc = true;

    //create a data object for function specifications from the user protos
    var fncSpecs = this.parseProtos(protos);
    if (!fncSpecs) {
      return;
    }

    this.assignRegs(fncSpecs);

    this.createLibrary(prjFolder, prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr, fncSpecs, makeAutoDoc);

    var libFile = path.join(prjFolder, prjname + ".c");
    var revFile = path.join(prjFolder, "revision.h");
    var basFile = path.join(prjFolder, prjname + "base.h");
    atom.open({pathsToOpen: [prjFolder, revFile, basFile, libFile], newWindow: true});

    this.close();
  }

  parseProtos(protos) {
    // Get rid of comments if there are any
    protos = protos.replace(/\/\/.*($|\n)|\/\*(?:.*\n)*?.*\*\//g, "");
    // Get rid of any possible left over empty lines
    protos = protos.replace(/^\s*\n/gm, "");
    // Get rid of indentations
    protos = protos.replace(/^\s*/gm, "");
    // Get rid of trailing spaces
    protos = protos.replace(/\s*$/gm, "");

    // Extract includes
    var includes = protos.match(/#include\s*<.*?>\n/g);
    if (includes) {
      var iMax = includes.length;
      for (var i = 0; i < iMax; i++) {
        protos = protos.replace(includes[i], "");
      }
      this.SDKincludes = includes;
    }
    includes = protos.match(/#include\s*".*?"\n/g);
    if (includes) {
      var iMax = includes.length;
      for (var i = 0; i < iMax; i++) {
        protos = protos.replace(includes[i], "");
      }
      this.LOCincludes = includes;
    }

    // Split statements
    var protosArray = protos.split(/;\s*|;\n/);

    // fail if suspicious
    if (protosArray.length == 1 || protosArray[protosArray.length - 1] != "") {
      this.showError("No function declaration found!");
      return null;
    }

    // create funcSpec object
    var fncSpecs = [];

    var iMax = protosArray.length - 1;
    for (var i = 0; i < iMax; i++) {
      var proto = protosArray[i];
      var argPart = proto.match(/\(.*\)/)[0];                    // get argument part of the proto
      if (!argPart) {
        var fncNo = i + 1;
        this.showError("Function " + fncNo.toString() + " has a syntax error!");
        return null;
      }
      var fncPart = proto.replace(argPart, "");                  // proto - argPart = fncPart
      if (fncPart.length == 0) {
        var fncNo = i + 1;
        this.showError("Function " + fncNo.toString() + " has a syntax error!");
        return null;
      }
      var fncName = fncPart.match(/\b[a-zA-Z][a-zA-z0-9]*$/)[0]; // last word is function name
      if (!fncName) {
        var fncNo = i + 1;
        this.showError("Function " + fncNo.toString() + " has a syntax error!");
        return null;
      }
      var retType = fncPart.replace(fncName, "");                // fncPart - fncName = retType
      var retType = retType.replace(/\s*$/, "");                 // get rid of unnecessary whitespaces
      if (retType.length == 0) retType = "void";

      argPart = argPart.match(/\(\s*(.*?)\s*\)$/)[1];                       // get rid of enclosing parentheses and whitespaces
      argPart = argPart.replace(/\s*REG\(\s*([ad][0-7])\s*,/g, "REG($1;");  // tidy up argPart for easy parsing with ","
      var args = argPart.split(/\s*,\s*/);                                  // split arguments
      var isVA = false;

      if (args.length > 11) {
        this.showError("Function " + fncName + " has more than 11 arguments!");
        return null;
      }

      var fncArgs = [];
      if (!(args[0].length == 0 || argPart == "void" || argPart == "VOID")) {
        var lMax = args.length;
        for (var l = 0; l < lMax; l++) {
          var arg = args[l];
          var argName;
          var argType;
          var argReg;
          // is a registry specified for this argument
          var match = arg.match(/REG\(([ad][0-7]);\s*(.*)\)/);
          if (match) {
            argReg = match[1];
            arg    = match[2];
          }
          else
            argReg = "auto";

          if (arg.match(/\s*\.\.\.\s*/)) {
            argName = "...";
            argType = "__VA_ARG__";
            isVA = true;
          }
          else {
            match = arg.match(/\b([a-zA-Z][a-zA-z0-9]*)\s*$/);
            if (!match) {
              this.showError("Function " + fncName + " has a missing argument!");
              return null;
            }
            argName = match[1];
            argType = arg.replace(argName, "");
            argType = argType.replace(/^\s+/, "");
            argType = argType.replace(/\s+$/, "");
            if (argType.length == 0) {
              var argNo = l + 1;
              this.showError("Argument " + argNo.toString() + " of function " + fncName + " is missing type specification!");
              return null;
            }
          }

          var fncArg = {
            "name": argName,
            "type": argType,
            "reg" : argReg,
          }
          fncArgs.push(fncArg);
          if (isVA) break;
        }
      }

      var fncSpec = {
        "name": fncName,
        "isVA": isVA,
        "rtrn": retType,
        "args": fncArgs
      }
      fncSpecs.push(fncSpec);
    }
    return fncSpecs;
  }

  assignRegs(fncSpecs) {
    var valueType = /^(?:(?:CONST|const)\s*)?(?:(?:unsigned\s+)?(?:char|short|long|int)|bool|double|float|U?(?:CHAR|BYTE|SHORT|COUNT|WORD|LONG)|BOOL|DOUBLE|FLOAT|(?:BYTE|WORD|LONG)BITS)$/;
    var doubleType = /\b(?:double|DOUBLE)\b/;

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      var regs = ["d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "a0", "a1", "a2", "a3"];
      var aRegIndex = 8;

      // exclude already assigned regs from available regs
      var lMax = fnc.args.length;
      for (var l = 0; l < lMax; l++) {
        var reg = fnc.args[l].reg;
        var type = fnc.args[l].type;
        if (reg != "auto") {
          var index = regs.indexOf(reg);
          if (index != -1) {
            if (type.match(doubleType)) {
              regs.splice(index, 2);
              if (index < aRegIndex) aRegIndex = aRegIndex - 2;
            }
            else {
              regs.splice(index, 1);
              if (index < aRegIndex) aRegIndex--;
            }
          }
        }
      }

      // populate an array for 2 adjacent d registers that are available
      var dRegs = [];
      if (regs.indexOf("d0") != -1 && regs.indexOf("d1") != -1) dRegs.push("d0");
      if (regs.indexOf("d2") != -1 && regs.indexOf("d3") != -1) dRegs.push("d2");
      if (regs.indexOf("d4") != -1 && regs.indexOf("d5") != -1) dRegs.push("d4");
      if (regs.indexOf("d6") != -1 && regs.indexOf("d7") != -1) dRegs.push("d6");

      // try to assign 2 adjacent d registers for double values in advance
      for (var l = 0; l < lMax; l++) {
        var reg = fnc.args[l].reg;
        var type = fnc.args[l].type;

        if (reg == "auto" && type.match(doubleType))
        {
          if (dRegs.length > 0) {
            fncSpecs[i].args[l].reg = dRegs[0];
            dRegs.splice(0, 1);
            regs.splice(regs.indexOf(fncSpecs[i].args[l].reg), 2);
            aRegIndex = aRegIndex - 2;
          }
          else {
            // we should throw an error here 'cos some arguments could
            // not be assigned to proper registers!
          }
        }
      }

      for (var l = 0; l < lMax; l++) {
        var reg = fnc.args[l].reg;
        var type = fnc.args[l].type;
        if (regs.length == 0) break;
        if (reg == "auto"){
          if (type.match(valueType)) {
            // assign a d register
            fncSpecs[i].args[l].reg = regs[0];
            regs.splice(0, 1);
            if (aRegIndex > 0) aRegIndex--;
          }
          else {
            if (aRegIndex < regs.length) { // (try) assign(ing) an a register if available...
              fncSpecs[i].args[l].reg = regs[aRegIndex];
              regs.splice(aRegIndex, 1);
            }
            else { // ...if not assign a d register
              if (type == "__VA_ARG__") { // this is the varargs stackpointer it has to be in an a register
                // locate the argument that got the "a3" register...
                for (var t = 0; t < lMax; t++) {
                  if (fncSpecs[i].args[t].reg == "a3") {
                    fncSpecs[i].args[t].reg = regs[0]; //..and re-assign it to the next available d register
                    // no need to splice regs since a vararg argument is always the last one
                    break;
                  }
                }
                // assign "a3" for this argument
                fncSpecs[i].args[l].reg = "a3";
              }
              else {
                fncSpecs[i].args[l].reg = regs[0];
                regs.splice(0, 1);
              }
            }
          }
        }
      }
    }
  }

  createXML(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr, fncSpecs) {
    var file = this.createGenericFile("xml.xml", prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr);
    var insPoint = "\t<include>dos/dos.h</include>";
    var ins = insPoint;

    var iMax = this.SDKincludes.length;
    for (var i = 0; i < iMax; i++) {
      ins += "\n\t<include>" + this.SDKincludes[i].match(/^#include\s*<(.*?)>/)[1] + "</include>";
    }

    file = file.replace(insPoint, ins);

    insPoint = "\t</interface>";
    ins = "";

    iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      ins += "\t\t<method name=\"" + fnc.name + "\" result=\"" + fnc.rtrn + "\"";

      var lMax = fnc.args.length;
      if (lMax) {
        ins += ">\n";
        for (var l = 0; l < lMax; l++) {
          var arg = fnc.args[l];
          ins += "\t\t\t<arg name=\"" + arg.name + "\" type=\"" + arg.type + "\"/>\n";
        }
        ins += "\t\t</method>\n";
      }
      else ins += "/>\n";
    }

    ins += insPoint;
    file = file.replace(insPoint, ins);

    return file;
  }

  createMOSStubs(prjName, baseName, fncSpecs) {
    var file = "#ifdef __MORPHOS__\n\n";

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      if (fnc.isVA) continue; // don't create stubs for vararg funcs!

      file += "LIBSTUB(" + fnc.name + ", " + fnc.rtrn + ")\n{\n";
      file += "\tstruct " + baseName + " *base = (struct " + baseName + "*)REG_A6;\n\t";
      if (fnc.rtrn != "void" && fnc.rtrn != "VOID") file += "return ";
      file += "LIB_" + fnc.name + "(base";
      var lMax = fnc.args.length;
      for (var l = 0; l < lMax; l++) {
        var arg = fnc.args[l];
        file += ", (" + arg.type + ")REG_" + arg.reg.toUpperCase();
      }
      file += ");\n}\n\n";
    }
    file += "#endif /* __MORPHOS__ */";
    return file;
  }

  createVecTable68K(prjName, prjname, iFaceName, fncSpecs) {
    var codesDir = path.resolve(__dirname, '..', './data/codes/lib');
    var file = fs.readFileSync(path.join(codesDir, "vectable68K.c"), 'utf8', (err, data) => {});
    file = file.replace(/__prjname__/g, prjname);
    file = file.replace(/__PrjName__/g, prjName);

    var stub_Innard =  "\n{\n\tstruct Library *Base = (struct Library *) regarray[REG68K_A6/4];\n";
        stub_Innard += "\tstruct ExtendedLibrary *ExtLib = (struct ExtendedLibrary *) ((ULONG)Base + Base->lib_PosSize);\n";
        stub_Innard += "\tstruct " + iFaceName + " *Self = (struct " + iFaceName + " *) ExtLib->MainIFace;\n\n\t";

    var stubs = "\n";
    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      if (fnc.isVA) continue;
      stubs += "STATIC " + fnc.rtrn + " stub_" + fnc.name + "PPC(ULONG *regarray)";
      stubs += stub_Innard;
      if (fnc.rtrn != "void" && fnc.rtrn != "VOID") stubs += "return ";
      stubs += "Self->" + fnc.name + "(\n\t\t";
      var lMax = fnc.args.length;
      for (var l = 0; l < lMax; l++) {
        var arg = fnc.args[l];
        if (l != 0) stubs += ",\n\t\t";
        stubs += "(" + arg.type + ")regarray[REG68K_" + arg.reg.toUpperCase() + "/4]";
      }
      stubs += "\n\t);\n}\n";
      stubs += "STATIC CONST struct EmuTrap stub_" + fnc.name + " = { TRAPINST, TRAPTYPE, (ULONG (*)(ULONG *))stub_" + fnc.name + "PPC };\n\n";
    }

    var vecTable = "CONST CONST_APTR VecTable68K[] =\n{\t&stub_Open,\n\t&stub_Close,\n\t&stub_Expunge,\n\t&stub_Reserved";
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      if (fnc.isVA) continue;
      vecTable += ",\n\t&stub_" + fnc.name;
    }
    vecTable += ",\n\t(CONST_APTR)-1\n};\n";

    return file + stubs + vecTable;
  }

  createProtos(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr) {
    var file = this.createGenericFile("proto.h", prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr);
    // load standard headers
    var codesDir = path.resolve(__dirname, '..', './data/codes');
    var std_h = fs.readFileSync(path.join(codesDir, 'std-headers.c'), 'utf8', (err, data) => {});

    if (this.chkSTD.checked) {
      var insPnt = "\n#include <exec/types.h>";
      file = file.replace(insPnt, std_h + insPnt);
    }

    //insert includes
    var insPoint = "#include <dos/dos.h>\n";
    var includes = insPoint;
    var iMax = this.SDKincludes.length;
    for (var i = 0; i < iMax; i++) {
      includes += this.SDKincludes[i];
    }
    iMax = this.LOCincludes.length;
    for (var i = 0; i < iMax; i++) {
      includes += this.LOCincludes[i];
    }
    file = file.replace(insPoint, includes);

    return file;
  }

  createPragmas(prjName, PRJNAME, baseName, fncSpecs) {
    var regs = ["d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "a0", "a1", "a2", "a3", "a4", "a5", "a6"];

    var codesDir = path.resolve(__dirname, '..', './data/codes/lib');
    var file = fs.readFileSync(path.join(codesDir, 'pragmas.h'), 'utf8', (err, data) => {});
    file = file.replace(/__PrjName__/g, prjName);
    file = file.replace(/__PRJNAME__/g, PRJNAME);
    file += "\n";

    var offSet = 30;  // default offset of first function in the stub to libBase
    var retReg = "0"; // default return register for a function

    // create SAS/C / DCC pragmas:
    file += "#ifdef __CLIB_PRAGMA_LIBCALL\n";
    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      var call;
      if (fnc.isVA) {
        call = "tagcall ";
        file += "\t#ifdef __CLIB_PRAGMA_TAGCALL\n\t";
      }
      else call = "libcall ";

      file += "\t#pragma " + call + baseName + " " + fnc.name + " " + offSet.toString(16) + " ";
      var lMax = fnc.args.length;
      for (var l = lMax - 1; l >= 0; l--) {
        var regID = regs.indexOf(fnc.args[l].reg);
        file += regID.toString();
      }
      file += retReg + lMax.toString() + "\n";
      if (fnc.isVA) file += "\t#endif\n";
      offSet += 6;
    }
    file += "#endif /* __CLIB_PRAGMA_LIBCALL */\n\n";

    // create MAXON / STORM C pragmas:
    offSet = 30;
    file += "#ifdef __CLIB_PRAGMA_AMICALL\n";
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      var call;
      if (fnc.isVA) {
        call = "tagcall(";
        file += "\t#ifdef __CLIB_PRAGMA_TAGCALL\n\t";
      }
      else call = "amicall(";

      file += "\t#pragma " + call + baseName + ", 0x" + offSet.toString(16) + ", " + fnc.name + "(";
      var lMax = fnc.args.length;
      for (var l = 0; l < lMax; l++) {
        if (l != 0) file += ",";
        file += fnc.args[l].reg;
      }
      file += "))\n";
      if (fnc.isVA) file += "\t#endif\n";
      offSet += 6;
    }
    file += "#endif /* __CLIB_PRAGMA_AMICALL */\n\n";

    file += "#endif /* PRAGMAS_" + PRJNAME + "_PRAGMAS_H */\n";
    return file;
  }

  createClibProtos(prjName, PRJNAME, fncSpecs) {
    var file = "#ifndef CLIB_" + PRJNAME + "_PROTOS_H\n#define CLIB_" + PRJNAME + "_PROTOS_H\n\n";
    file += "// This file is a part of " + prjName + "\n\n#include <exec/types.h>\n\n";

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      file += this.createFncProto(fncSpecs[i]);
    }

    file += "\n#endif /* CLIB_" + PRJNAME + "_PROTOS_H */\n";
    return file;
  }

  createInline(prjName, PRJNAME, baseName, fncSpecs, isPPC) {
    var file = "";
    var PPC = "";
    if (isPPC) PPC = "PPC";

    file = "#ifndef _" + PPC + "INLINE_" + PRJNAME + "_H\n#define _" + PPC + "INLINE_" + PRJNAME + "_H\n\n";
    file += "// This file is a part of " + prjName + "\n\n";

    file += "#ifndef _SFDC_VARARG_DEFINED\n\t#define _SFDC_VARARG_DEFINED\n";
    file += "\t#ifdef __HAVE_IPTR_ATTR__\n\t\ttypedef APTR _sfdc_vararg __attribute__((iptr));\n\t#else\n";
    file += "\t\ttypedef ULONG _sfdc_vararg;\n\t#endif /* __HAVE_IPTR_ATTR__ */\n#endif /* _SFDC_VARARG_DEFINED */\n\n";

    file += "#include <" + PPC.toLowerCase() + "inline/macros.h>\n\n";
    file += "#ifndef " + PRJNAME + "_BASE_NAME\n#define " + PRJNAME + "_BASE_NAME " + baseName + "\n#endif\n\n";

    var offSet = 30;  // default offset of first function in the stub to libBase
    var tglVer = "";  // the taglist version of a vararg function (if there is)

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var func = fncSpecs[i];
      if (func.isVA) {
        // search for a taglist version of this function in protos
        for (var s = 0; s < iMax; s++) {
          var cutName = func.name.replace(/Tags$/, "");
          if (fncSpecs[s].name == func.name + "A" || fncSpecs[s].name == cutName + "TagList") {
            tglVer = fncSpecs[s].name;
            break;
          }
        }
        if (tglVer.length == 0 || func.args.length < 2) continue; // if not found, no inline macro for this function
        else file += "#ifndef NO_INLINE_STDARG\n";
      }

      file += "#define " + func.name + "(";
      var lMax = func.args.length;
      for (var l = 0; l < lMax; l++) {
        if (l != 0) file += ", ";
        file += func.args[l].name;
      }
      if (func.isVA) {
        file += ") \\\n\t({_sfdc_vararg _args[] = {" + func.args[lMax - 2].name +  ", __VA_ARGS__}; " + tglVer + "(";
        for (var l = 0; l < lMax - 2; l++) {       // do not take the last argument 'cos it's the Tag tag
          var arg = func.args[l];
          file += "(" + arg.name + "), ";
        }
        file += "(const APTR) _args); })\n";
        file += "#endif /* NO_INLINE_STDARG */\n\n";
      }
      else {
        file += ") \\\n\tLP" + lMax.toString();
        if (func.rtrn == "void" || func.rtrn == "VOID")
          file += "NR(0x" + offSet.toString(16) + ", ";
        else
          file += "(0x" + offSet.toString(16) + ", " + func.rtrn + ", ";
        file += func.name + ", ";
        for (var l = 0; l < lMax; l++) {
          var arg = func.args[l];
          file += arg.type + ", " + arg.name + ", " + arg.reg + ", ";
        }
        file += "\\\n\t, " + PRJNAME + "_BASE_NAME";
        if (isPPC) file += ", 0, 0, 0, 0, 0, 0)\n\n";
        else file += ")\n\n";
      }
      offSet += 6;
    }

    file += "#endif /* _" + PPC + "INLINE_" + PRJNAME + "_H */\n";
    return file;
  }

  createInline4(prjName, PRJNAME, iFacePtr, fncSpecs) {
    var file;

    file = "#ifndef _INLINE4_" + PRJNAME + "_H\n#define _INLINE4_" + PRJNAME + "_H\n\n";
    file += "// This file is a part of " + prjName + "\n";
    file += "// ...provides compatibility to OS3 style library function calls.\n\n";
    file += "#include <exec/types.h>\n";
    file += "#include <exec/exec.h>\n";
    file += "#include <exec/interfaces.h>\n";
    file += "#include <interfaces/" + prjName.toLowerCase() + ".h>\n\n";

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var func = fncSpecs[i];

      var macro = "#define " + func.name + "(";
      var lMax = func.args.length;
      for (var l = 0; l < lMax; l++) {
        if (l != 0) macro += ", ";
        macro += func.args[l].name;
      }
      macro += ") " + iFacePtr + "->" + func.name + "(";
      for (var l = 0; l < lMax; l++) {
        if (l != 0) macro += ", ";
        if (func.isVA && l == lMax - 1)
          macro += "__VA_ARGS__";
        else
          macro += "(" + func.args[l].name + ")";
      }
      macro += ")\n";

      if (func.isVA) {
        file += "#if (defined(__STDC_VERSION__) && __STDC_VERSION__ >= 199901L) || (__GNUC__ >= 3)\n";
        file += macro;
        file += "#elif (__GNUC__ == 2 && __GNUC_MINOR__ >= 95)\n";
        file += macro.replace("__VA_ARGS__", "## vargs");
        file += "#endif\n";
      }
      else {
        file += macro;
      }
    }

    file += "\n#endif /* _INLINE4_" + PRJNAME + "_H */\n";
    return file;
  }

  createInterfaces(prjName, PRJNAME, iFaceName, fncSpecs) {
    var file;

    file = "#ifndef "+ PRJNAME + "_INTERFACE_H\n#define " + PRJNAME + "_INTERFACE_H\n\n";
    file += "// This file is a part of " + prjName + "\n\n";
    file += "#include <exec/types.h>\n";
    file += "#include <exec/exec.h>\n";
    file += "#include <exec/interfaces.h>\n\n";
    file += "struct " + iFaceName + "\n{\n\tstruct InterfaceData Data;\n\n";
    file += "\tULONG APICALL (*Obtain)(struct " + iFaceName + " *Self);\n";
    file += "\tULONG APICALL (*Release)(struct " + iFaceName + " *Self);\n";
    file += "\tvoid APICALL (*Expunge)(struct " + iFaceName + " *Self);\n";
    file += "\tstruct Interface * APICALL (*Clone)(struct " + iFaceName + " *Self);\n\n";

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var func = fncSpecs[i];
      file += "\t" + func.rtrn + " APICALL (*" + func.name + ")(struct " + iFaceName + " *Self";
      var lMax = func.args.length;
      for (var l = 0; l < lMax; l++) {
        if (func.isVA && l == lMax - 1) {
          file += ", ..."; break;
        }
        else
          file += ", " + func.args[l].type + " " + func.args[l].name;
      }
      file += ");\n";
    }
    file += "};\n\n";

    file += "\n#endif /* "+ PRJNAME + "_INTERFACE_H */\n";
    return file;
  }

  createMakefile(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr) {
    var file = this.createGenericFile("makefile", prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr);
    if (this.chkVecTable.checked) {
      // move OBJS definition into os branches
      file = file.replace(/\nOBJS = \w*\.o init\.o\n/, "");

      var os3SplitPnt = "LFLAGS = -s -noixemul -nostdlib -nostartfiles";
      var os4SplitPnt = "LFLAGS = -noixemul -nostdlib -nostartfiles";
      var mosSplitPnt = "LFLAGS = -s -noixemul -nostdlib -nostartfiles -lgcc";

      var os3Objs = os3SplitPnt + "\n  OBJS = " + prjname + ".o init.o";
      var os4Objs = os4SplitPnt + "\n  OBJS = " + prjname + ".o init.o " + prjname + "68k.o";
      var mosObjs = mosSplitPnt + "\n  OBJS = " + prjname + ".o init.o";

      file = file.replace(os3SplitPnt, os3Objs);
      file = file.replace(os4SplitPnt, os4Objs);
      file = file.replace(mosSplitPnt, mosObjs);

      //remove NO_VECTABLE68K definition
      file = file.replace(" -DNO_VECTABLE68K", "");
    }
    return file;
  }

  createGenericFile(fileName, prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr) {
    var codesDir = path.resolve(__dirname, '..', './data/codes/lib');
    var file = fs.readFileSync(path.join(codesDir, fileName), 'utf8', (err, data) => {});
    file = file.replace(/__prjname__/g, prjname);
    file = file.replace(/__PrjName__/g, prjName);
    file = file.replace(/__PRJNAME__/g, PRJNAME);
    file = file.replace(/__BaseName__/g, baseName);
    file = file.replace(/__IFaceName__/g, iFaceName);
    file = file.replace(/__IFacePtr__/g, iFacePtr);
    return file;
  }

  createFunctions(prjName, prjname, baseName, fncSpecs, makeAutoDoc) {
    var codesDir = path.resolve(__dirname, '..', './data/codes/lib');
    var file = fs.readFileSync(path.join(codesDir, 'lib.c'), 'utf8', (err, data) => {});
    file = file.replace(/__PrjName__/g, prjName);
    file = file.replace(/__prjname__/g, prjname);
    file = file.replace(/__BaseName__/g, baseName);

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      file += "\/\/\/" + fnc.name + "\n";
      if (makeAutoDoc) {
        var aDocHead = "/****** " + prjName + "/" + fnc.name;
        var lMax = aDocHead.length;
        for (var l = 0; l < 78 - lMax; l++) { aDocHead += "*"; }
        file += aDocHead + "\n*\n";
        file += "*   NAME\n";
        file += "*      " + fnc.name + " -- Description\n*\n";
        file += "*   SYNOPSIS\n";
        file += "*      " + this.createFncProto(fnc) + "*\n";
        file += "*   FUNCTION\n*\n*   INPUTS\n*\n*   RESULT\n*\n*   EXAMPLE\n*\n";
        file += "*   NOTES\n*\n*   BUGS\n*\n*   SEE ALSO\n*\n";
        file += "*****************************************************************************\n*\n*/\n\n";
      }

      if (fnc.isVA) file += "#ifdef __amigaos4__\n";
      file += this.createLibProto(fnc, false);

      file += "\n{\n";
      if (fnc.rtrn == "void" || fnc.rtrn == "VOID")
        file += "\n";
      else
        file += "\t" + fnc.rtrn + " result = 0;\n\n\treturn result;\n";
      file += "}\n";
      if (fnc.isVA) file += "#endif\n";
      file += "\/\/\/\n";
    }
    file += "\n\/\/\/MorphOS stubs\n";
    file += this.createMOSStubs(prjName, baseName, fncSpecs);
    file += "\n\/\/\/\n";

    return file;
  }

  createLibVector(prjName, fncSpecs) {
    var file = "// This file is a part of " + prjName + "\n\n";

    var iMax = fncSpecs.length;
    for (var i = 0; i < iMax; i++) {
      var fnc = fncSpecs[i];
      if (fnc.isVA) file += "#ifdef __amigaos4__\n";
      file += "extern " + this.createLibProto(fnc, true) + ";\n";
      if (fnc.isVA) file += "#endif\n";
    }
    file += "\n";

    file += "#define libvector ";
    if (fncSpecs[0].isVA) file += "LFUNC_VAS";
    else file += "LFUNC_FAS";
    file += "(" + fncSpecs[0].name + ")";
    for (var i = 1; i < iMax; i++) {
      var fnc = fncSpecs[i];
      file += "\\\n                  ";
      if (fnc.isVA) file += "LFUNC_VA_";
      else file += "LFUNC_FA_";
      file += "(" + fnc.name + ")";
    }
    file += "\n";

    return file;
  }

  createInitFile(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr) {
    var file = this.createGenericFile("init.c", prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr);

    return file;
  }

  createFncProto(fncSpec) {
    var proto = fncSpec.rtrn + " " + fncSpec.name + "(";
    var lMax = fncSpec.args.length;
    for (var l = 0; l < lMax; l++) {
      var arg = fncSpec.args[l];
      if (l != 0) proto += ", ";
      if (arg.type == "__VA_ARG__")
        proto += arg.name;
      else
        proto += arg.type + " " + arg.name;
    }
    proto += ");\n";

    return proto;
  }

  createLibProto(fncSpec, isForwDec) {
    var proto;
    if (fncSpec.isVA) proto = "LIBPROTOVA";
    else proto = "LIBPROTO";
    proto += "(" + fncSpec.name + ", " + fncSpec.rtrn + ", REG(a6, UNUSED __BASE_OR_IFACE)";
    var lMax = fncSpec.args.length;
    for (var l = 0; l < lMax; l++) {
      var arg = fncSpec.args[l];
      proto += ", ";
      if (fncSpec.isVA && l == lMax - 1) proto += "...";
      else {
        proto += "REG(" + arg.reg + ", " + arg.type;
        if (!isForwDec) proto += " " + arg.name;
        proto += ")";
      }
    }
    proto += ")";

    return proto;
  }

  createIncludes(prjFolder, prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr, fncSpecs) {
    var folders = ["clib", "inline", "inline4", "interfaces", "ppcinline", "pragmas", "proto"];
    var encode = "utf8";
    var header = prjname + ".h";

    var includeFolder = path.join(prjFolder, "include");
    fs.mkdirSync(includeFolder);

    var iMax = folders.length;
    for (var i = 0; i < iMax; i++) {
      fs.mkdirSync(path.join(includeFolder, folders[i]));
    }
    var clibName = path.join(path.join(includeFolder, folders[0]), prjname + "_protos.h");
    var inlineName = path.join(path.join(includeFolder, folders[1]), header);
    var inline4Name = path.join(path.join(includeFolder, folders[2]), header);
    var interfacesName = path.join(path.join(includeFolder, folders[3]), header);
    var ppcInlineName = path.join(path.join(includeFolder, folders[4]), header);
    var pragmasName = path.join(path.join(includeFolder, folders[5]), header);
    var protoName = path.join(path.join(includeFolder, folders[6]), header);
    var xmlName = path.join(includeFolder, prjname + ".xml");

    fs.writeFileSync(clibName, this.createClibProtos(prjName, PRJNAME, fncSpecs), encode);
    fs.writeFileSync(inlineName, this.createInline(prjName, PRJNAME, baseName, fncSpecs, false), encode);
    fs.writeFileSync(inline4Name, this.createInline4(prjName, PRJNAME, iFacePtr, fncSpecs), encode);
    fs.writeFileSync(interfacesName, this.createInterfaces(prjName, PRJNAME, iFaceName, fncSpecs), encode);
    fs.writeFileSync(ppcInlineName, this.createInline(prjName, PRJNAME, baseName, fncSpecs, true), encode);
    fs.writeFileSync(pragmasName, this.createPragmas(prjName, PRJNAME, baseName, fncSpecs), encode);
    fs.writeFileSync(protoName, this.createProtos(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr), encode);

    if (this.chkXML.checked) {
      fs.writeFileSync(xmlName, this.createXML(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr, fncSpecs), encode);
    }

    var includesFolder = path.join(prjFolder, "includes");
    fs.mkdirSync(includesFolder);
    if (fs.existsSync(includesFolder)) {
      // copy SDI-Headers
      var sdiDir = path.resolve(__dirname, '..', './data/codes/SDI');
      var files = fs.readdirSync(sdiDir);
      for (var i = 0; i < files.length; i++)
        fs.copyFileSync(path.join(sdiDir, files[i]), path.join(includesFolder, files[i]));

      fs.writeFileSync(path.join(includesFolder, 'readme.md'),
      'For more information on SDI-headers refer to:\nhttp://aminet.net/package/dev/c/SDI_headers', 'utf8');
    }
  }

  createLibrary(prjFolder, prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr, fncSpecs, makeAutoDoc) {
    var encode = "utf8";

    fs.mkdirSync(prjFolder);

    var libFileName = path.join(prjFolder, prjname + ".c");
    var libBaseName = path.join(prjFolder, prjname + "base.h");
    var libV68KName = path.join(prjFolder, prjname + "68k.c");

    fs.writeFileSync(path.join(prjFolder, "revision.h"), this.createGenericFile("revision.h", prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr), encode);
    fs.writeFileSync(path.join(prjFolder, "SDI_macros.h"), this.createGenericFile("SDI_macros.h", prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr), encode);
    fs.writeFileSync(path.join(prjFolder, "init.c"), this.createInitFile(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr), encode);
    fs.writeFileSync(libFileName, this.createFunctions(prjName, prjname, baseName, fncSpecs, makeAutoDoc), encode);
    fs.writeFileSync(libBaseName, this.createGenericFile("libbase.h", prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr), encode);
    fs.writeFileSync(path.join(prjFolder, "makefile"), this.createMakefile(prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr), encode);
    fs.writeFileSync(path.join(prjFolder, "vectors.h"), this.createLibVector(prjName, fncSpecs), encode);
    if (this.chkVecTable.checked) {
      fs.writeFileSync(libV68KName, this.createVecTable68K(prjName, prjname, iFaceName, fncSpecs), encode);
    }

    this.createIncludes(prjFolder, prjName, prjname, PRJNAME, baseName, iFaceName, iFacePtr, fncSpecs);
  }
};
