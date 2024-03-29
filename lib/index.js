const fs = require('fs');
const path = require('path');
const os = require('os');
const CompositeDisposable = require('atom').CompositeDisposable;
const provider = require('./autocomplete-provider');
const New_Project_Dialog = require('./new-project-dialog');
const New_SubClass_Dialog = require('./new-subclass-dialog');
const New_Library_Dialog = require('./new-library-dialog');

module.exports = {
  // Configuration schema
  config: {
    "highlightPrefs": {
      "title": "Syntax Highlighting Preferences",
      "type": "object",
      "description": "Provides traditional syntax highlighting for function, macro, enum and variable identifiers in AmigaOS SDK. Symbols from the selected libraries below will be highlighted.",
      "order": 1,
      "properties": {
        "SDK": {
          "title": "Highlight AmigaOS SDK symbols",
          "type": "boolean",
          "default": true,
          "order": 1
        },
        "compiler": {
          "title": "Highlight compiler symbols for:",
          "type": "string",
          "default": "SAS/C",
          "enum": [
            "SAS/C",
            "GNU-C",
            "VBCC"
          ],
          "order": 8
        },
        "linkLib": {
          "title": "Highlight link library symbols for:",
          "type": "string",
          "default": "none",
          "enum": [
            "none",
            "libnix",
            "clib2"
          ],
          "order": 8
        },
        "NET": {
          "title": "Highlight NET symbols (AmiTCP/bsdsocket.library)",
          "type": "boolean",
          "default": false,
          "order": 2
        },
        "AHI": {
          "title": "Highlight AHI symbols",
          "type": "boolean",
          "default": false,
          "order": 3
        },
        "CGFX": {
          "title": "Highlight CyberGfx symbols",
          "type": "boolean",
          "default": false,
          "order": 4
        },
        "P96": {
          "title": "Highlight Picasso96 symbols",
          "type": "boolean",
          "default": false,
          "order": 5
        },
        "W3D": {
          "title": "Highlight Warp3D symbols",
          "type": "boolean",
          "default": false,
          "order": 6
        },
        "GUI": {
          "title": "Highlight GUI symbols for:",
          "type": "string",
          "default": "Reaction",
          "enum": [
            "none",
            "Reaction",
            "MUI",
            "MUI (with shortcut macros)",
          ],
          "order": 7
        },
        "obsolete": {
          "title": "Highlight obsolete symbols",
          "description": "Highlights obsolete symbols in warning colors. When disabled, these symbols will still be highlighted as regular because they are still defined in the SDK headers for backwards compatibility.",
          "type": "boolean",
          "default": false,
          "order": 10
        },
        "OS4": {
          "title": "Include OS4 symbols",
          "description": "Adds highlighting and autoComplete suggestions for OS4 symbols.",
          "type": "boolean",
          "default": false,
          "order": 11
        }
      }
    },
    "autoCompPrefs": {
      "title": "Auto-Complete Provider Preferences",
      "type": "object",
      "order": 2,
      "properties": {
        "autoComplete": {
          "title": "Suggest auto-completions for SDK symbols.",
          "description": "(Suggestions and snippets are currently available for OS3, OS4, AHI and MUI functions/structs.)",
          "type": "boolean",
          "default": true,
          "order": 1
        },
        "caseSens": {
          "title": "Case sensitivity for suggestions:",
          "type": "string",
          "description": "\"Smart\" automatically switches case sensitivity \"On\" and \"Off\" depending on the cursor location. It will switch case sensitivity \"On\" when you are typing function arguments and turn it back \"Off\" when the cursor is out of function argument parentheses.",
          "default": "Smart",
          "enum": [
            "On",
            "Off",
            "Smart"
          ],
          "order": 2
        }
      }
    },
    "newPrjPrefs": {
      "title": "New Project Strings",
      "type": "object",
      "order": 3,
      "properties": {
        "authName": {
          "title": "Author name",
          "description": "Your full name (or nickname, or company name) to be used in your new projects.",
          "type": "string",
          "default": "",
          "order": 1
        },
        "authContact": {
          "title": "Author Contact",
          "description": "Your (or your company's) e-mail address to be used in your new projects.",
          "type": "string",
          "default": "",
          "order": 2
        },
        "prjDir": {
          "title": "Project Directory",
          "description": "New projects will be created in this directory.",
          "type": "string",
          "order": 3
        }
      }
    }
  },

  activate: function(state){
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.config.onDidChange("language-amigaos-c.highlightPrefs", ({oldvalue, newvalue}) => {
        var grammarFile1 = path.resolve(__dirname, '..', './grammar/amigaos-SDK-Symbols.cson');
        var grammarFile2 = path.resolve(__dirname, '..', './grammar/amigaos-SDK-FNC-Symbols.cson');
        var completionsFile = path.resolve(__dirname, '..', './completions/autoCompletions.JSON');
        var fncContextFile = path.resolve(__dirname, '..', './completions/fncContext.JSON');
        if (fs.existsSync(grammarFile1)) fs.unlinkSync(grammarFile1);
        if (fs.existsSync(grammarFile2)) fs.unlinkSync(grammarFile2);
        if (fs.existsSync(completionsFile)) fs.unlinkSync(completionsFile);
        if (fs.existsSync(fncContextFile)) fs.unlinkSync(fncContextFile);
      }
    ));

    atom.commands.add('atom-workspace', {
      'lang-amigaos:new-project': this.newProject.bind(this),
      'lang-amigaos:new-subclass': this.newSubclass.bind(this),
      'lang-amigaos:new-library': this.newLibrary.bind(this),
      'lang-amigaos:settings': ()=>{atom.workspace.open('atom://config/packages/language-amigaos-c');}
    });

    this.createGrammar();
    atom.grammars.loadGrammarSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-FNC-Symbols.cson'));
    atom.grammars.loadGrammarSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-Symbols.cson'));
    provider.loadCompletions();
  },

  deactivate: function() {
    this.subscriptions.dispose();
  },

  consumeTreeView (treeView) {
    this.treeView = treeView;
  },

  provide: function() {
    return(provider);
  },

  newProject: function() {
    var dialog = new New_Project_Dialog();
    dialog.attach();
  },

  newSubclass: function() {
    var prj_paths = atom.project.getPaths();
    if (prj_paths.length) {
      var directory;

      if (this.treeView) {
        directory = this.treeView.selectedPaths()[0];
        if (directory) {
          if (!fs.lstatSync(directory).isDirectory())
            directory = path.dirname(directory);
          if (directory == '.') directory = prj_paths[0];
        }
        else directory = prj_paths[0];
      }
      else
        directory = prj_paths[0];

      var dialog = new New_SubClass_Dialog(directory);
      dialog.attach();
    }
  },

  newLibrary: function() {
    var dialog = new New_Library_Dialog();
    dialog.attach();
  },

  insertMethods: function(sdkData, muiData) {
    var sPoint1 = sdkData.search(/\["DoMethod"\],/);
    if (sPoint1 != -1) {
      var slice1 = sdkData.slice(0, sPoint1);
      var slice2 = sdkData.slice(sPoint1);
      var sPoint2 = slice2.search(/\]\n\s*}/);
      if (sPoint2 != -1) {
        var slice3 = slice2.slice(sPoint2);
        slice2 = slice2.slice(0, sPoint2);
        return slice1.concat(slice2, ", ", muiData.trimEnd(), slice3);
      }
    }
    return sdkData;
  },

  createGrammar: function() {
    // if the grammar files does not exist create them
    // (now also creates the autoComplete suggesstion files)
    if (!(fs.existsSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-Symbols.cson')))) {
      var introData    = fs.readFileSync(path.resolve(__dirname, '..', './data/_INTRO'));
      var introData2   = fs.readFileSync(path.resolve(__dirname, '..', './data/_INTRO-FNC'));
      var introData3   = Buffer.from("[\n");
      var outroData    = Buffer.from("]");
      var comma        = Buffer.from("\t,\n");
      var bufferSize   = introData.length + outroData.length;
      var bufferSize2  = introData2.length + outroData.length;
      var bufferSize3  = introData3.length + outroData.length;
      var bufferSize4  = bufferSize3;
      var dataArray    = [introData];
      var dataArray2   = [introData2];
      var dataArray3   = [introData3];
      var dataArray4   = [introData3];

      if (atom.config.get('language-amigaos-c.highlightPrefs.SDK')) {
        if (atom.config.get('language-amigaos-c.highlightPrefs.obsolete')) {
          var sdkObs  = fs.readFileSync(path.resolve(__dirname, '..', './data/SDK-Obsolete-Symbols'));
          bufferSize  = bufferSize  + sdkObs.length;
          dataArray.push(sdkObs);

          if (atom.config.get('language-amigaos-c.highlightPrefs.OS4')) {
            var os4Obs = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-SDK-Obsolete-Symbols'));
            bufferSize = bufferSize + os4Obs.length;
            dataArray.push(os4Obs);
          }
        }
        if (atom.config.get('language-amigaos-c.highlightPrefs.OS4')) {
          var sdkOS4Data  = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-SDK-Symbols'));
          var sdkOS4Data2 = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-SDK-FNC-Symbols'));
          bufferSize   = bufferSize  + sdkOS4Data.length;
          bufferSize2  = bufferSize2 + sdkOS4Data2.length;
          dataArray.push(sdkOS4Data);
          dataArray2.push(sdkOS4Data2);
        }
        var sdkData  = fs.readFileSync(path.resolve(__dirname, '..', './data/SDK-Symbols'));
        var sdkData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/SDK-FNC-Symbols'));
        var sdkData3 = fs.readFileSync(path.resolve(__dirname, '..', './data/SDK-Completions'));
        var sdkData4 = fs.readFileSync(path.resolve(__dirname, '..', './data/SDK-FNC-Context'));
        bufferSize   = bufferSize  + sdkData.length;
        bufferSize2  = bufferSize2 + sdkData2.length;
        bufferSize3  = bufferSize3 + sdkData3.length;
        //Insert context suggestions for MUI Methods into DoMethod()'s context
        if (atom.config.get('language-amigaos-c.highlightPrefs.GUI') == "MUI" || atom.config.get('language-amigaos-c.highlightPrefs.GUI') == "MUI (with shortcut macros)") {
          var muiData4 = fs.readFileSync(path.resolve(__dirname, '..', './data/MUI-Methods'));
          if (muiData4) {
            sdkData4 = Buffer.from(this.insertMethods(sdkData4.toString(), muiData4.toString()));
          }
        }

        bufferSize4  = bufferSize4 + sdkData4.length;
        dataArray.push(sdkData);
        dataArray2.push(sdkData2);
        dataArray3.push(sdkData3);
        dataArray4.push(sdkData4);
        if (atom.config.get('language-amigaos-c.highlightPrefs.OS4')) {
          var sdkOS4Data3 = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-SDK-Completions'));
          bufferSize3 = bufferSize3 + sdkOS4Data3.length + comma.length;
          dataArray3.push(comma);
          dataArray3.push(sdkOS4Data3);
          var sdkOS4Data4 = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-SDK-FNC-Context'));
          bufferSize4 = bufferSize4 + sdkOS4Data4.length + comma.length;
          dataArray4.push(comma);
          dataArray4.push(sdkOS4Data4);
        }
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.compiler') == "GNU-C") {
        var gccData  = fs.readFileSync(path.resolve(__dirname, '..', './data/GCC-Symbols'));
        var gccData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/GCC-FNC-Symbols'));
        bufferSize   = bufferSize  + gccData.length;
        bufferSize2  = bufferSize2 + gccData2.length;
        dataArray.push(gccData);
        dataArray2.push(gccData2);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.compiler') == "VBCC") {
        var vbccData  = fs.readFileSync(path.resolve(__dirname, '..', './data/VBCC-Symbols'));
        var vbccData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/VBCC-FNC-Symbols'));
        bufferSize    = bufferSize  + vbccData.length;
        bufferSize2   = bufferSize2 + vbccData2.length;
        dataArray.push(vbccData);
        dataArray2.push(vbccData2);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.linkLib') == "libnix") {
        var libnixData  = fs.readFileSync(path.resolve(__dirname, '..', './data/LIBNIX-Symbols'));
        var libnixData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/LIBNIX-FNC-Symbols'));
        bufferSize      = bufferSize  + libnixData.length;
        bufferSize2     = bufferSize2 + libnixData2.length;
        dataArray.push(libnixData);
        dataArray2.push(libnixData2);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.linkLib') == "clib2") {
        var clib2Data  = fs.readFileSync(path.resolve(__dirname, '..', './data/CLIB2-Symbols'));
        var clib2Data2 = fs.readFileSync(path.resolve(__dirname, '..', './data/CLIB2-FNC-Symbols'));
        bufferSize     = bufferSize  + clib2Data.length;
        bufferSize2    = bufferSize2 + clib2Data2.length;
        dataArray.push(clib2Data);
        dataArray2.push(clib2Data2);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.NET')) {
        var netData  = fs.readFileSync(path.resolve(__dirname, '..', './data/NET-Symbols'));
        var netData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/NET-FNC-Symbols'));
        var netData3 = fs.readFileSync(path.resolve(__dirname, '..', './data/NET-Completions'));
        var netData4 = fs.readFileSync(path.resolve(__dirname, '..', './data/NET-FNC-Context'));
        bufferSize   = bufferSize  + netData.length;
        bufferSize2  = bufferSize2 + netData2.length;
        bufferSize3  = bufferSize3 + netData3.length;
        bufferSize4  = bufferSize4 + netData4.length;
        dataArray.push(netData);
        dataArray2.push(netData2);
        if (dataArray3.length > 1){
          bufferSize3 = bufferSize3 + comma.length;
          dataArray3.push(comma);
        }
        dataArray3.push(netData3);
        if (dataArray4.length > 1){
          bufferSize4 = bufferSize4 + comma.length;
          dataArray4.push(comma);
        }
        dataArray4.push(netData4);
        if (atom.config.get('language-amigaos-c.highlightPrefs.OS4')) {
          var netOS4Data  = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-NET-Symbols'));
          var netOS4Data2 = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-NET-FNC-Symbols'));
          var netOS4Data3 = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-NET-Completions'));
          var netOS4Data4 = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-NET-FNC-Context'));
          bufferSize   = bufferSize  + netOS4Data.length;
          bufferSize2  = bufferSize2 + netOS4Data2.length;
          bufferSize3  = bufferSize3 + netOS4Data3.length + comma.length;
          bufferSize4  = bufferSize4 + netOS4Data4.length + comma.length;
          dataArray.push(netOS4Data);
          dataArray2.push(netOS4Data2);
          dataArray3.push(comma);
          dataArray3.push(netOS4Data3);
          dataArray4.push(comma);
          dataArray4.push(netOS4Data4);
        }
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.AHI')) {
        if (atom.config.get('language-amigaos-c.highlightPrefs.obsolete')) {
          var ahiObs  = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-Obsolete-Symbols'));
          bufferSize  = bufferSize  + ahiObs.length;
          dataArray.push(ahiObs);
        }
        var ahiData  = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-Symbols'));
        var ahiData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-FNC-Symbols'));
        var ahiData3 = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-Completions'));
        var ahiData4 = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-FNC-Context'));
        bufferSize   = bufferSize  + ahiData.length;
        bufferSize2  = bufferSize2 + ahiData2.length;
        bufferSize3  = bufferSize3 + ahiData3.length;
        bufferSize4  = bufferSize4 + ahiData4.length;
        dataArray.push(ahiData);
        dataArray2.push(ahiData2);
        if (dataArray3.length > 1){
          bufferSize3 = bufferSize3 + comma.length;
          dataArray3.push(comma);
        }
        dataArray3.push(ahiData3);
        if (dataArray4.length > 1){
          bufferSize4 = bufferSize4 + comma.length;
          dataArray4.push(comma);
        }
        dataArray4.push(ahiData4);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.CGFX')) {
        var cgfxData  = fs.readFileSync(path.resolve(__dirname, '..', './data/CyberGfx-Symbols'));
        var cgfxData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/CyberGfx-FNC-Symbols'));
        var cgfxData3 = fs.readFileSync(path.resolve(__dirname, '..', './data/CyberGfx-Completions'));
        var cgfxData4 = fs.readFileSync(path.resolve(__dirname, '..', './data/CyberGfx-FNC-Context'));
        bufferSize   = bufferSize  + cgfxData.length;
        bufferSize2  = bufferSize2 + cgfxData2.length;
        if (dataArray3.length > 1){
          bufferSize3 = bufferSize3 + comma.length;
          dataArray3.push(comma);
        }
        bufferSize3 = bufferSize3 + cgfxData3.length;
        if (dataArray4.length > 1){
          bufferSize4 = bufferSize4 + comma.length;
          dataArray4.push(comma);
        }
        bufferSize4 = bufferSize4 + cgfxData4.length;
        dataArray.push(cgfxData);
        dataArray2.push(cgfxData2);
        dataArray3.push(cgfxData3);
        dataArray4.push(cgfxData4);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.P96')) {
        var p96Data  = fs.readFileSync(path.resolve(__dirname, '..', './data/P96-Symbols'));
        var p96Data2 = fs.readFileSync(path.resolve(__dirname, '..', './data/P96-FNC-Symbols'));
        var p96Data3 = fs.readFileSync(path.resolve(__dirname, '..', './data/P96-Completions'));
        var p96Data4 = fs.readFileSync(path.resolve(__dirname, '..', './data/P96-FNC-Context'));
        bufferSize   = bufferSize  + p96Data.length;
        bufferSize2  = bufferSize2 + p96Data2.length;
        if (dataArray3.length > 1){
          bufferSize3 = bufferSize3 + comma.length;
          dataArray3.push(comma);
        }
        bufferSize3 = bufferSize3 + p96Data3.length;
        if (dataArray4.length > 1){
          bufferSize4 = bufferSize4 + comma.length;
          dataArray4.push(comma);
        }
        bufferSize4 = bufferSize4 + p96Data4.length;
        dataArray.push(p96Data);
        dataArray2.push(p96Data2);
        dataArray3.push(p96Data3);
        dataArray4.push(p96Data4);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.W3D')) {
        var w3dData  = fs.readFileSync(path.resolve(__dirname, '..', './data/W3D-Symbols'));
        var w3dData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/W3D-FNC-Symbols'));
        bufferSize   = bufferSize  + w3dData.length;
        bufferSize2  = bufferSize2 + w3dData2.length;
        dataArray.push(w3dData);
        dataArray2.push(w3dData2);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.GUI')  == "Reaction") {
        if (atom.config.get('language-amigaos-c.highlightPrefs.obsolete')) {
          var reactionObs  = fs.readFileSync(path.resolve(__dirname, '..', './data/Reaction-Obsolete-Symbols'));
          bufferSize  = bufferSize  + reactionObs.length;
          dataArray.push(reactionObs);
        }
        var reactionData  = fs.readFileSync(path.resolve(__dirname, '..', './data/Reaction-Symbols'));
        var reactionData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/Reaction-FNC-Symbols'));
        var reactionData3 = fs.readFileSync(path.resolve(__dirname, '..', './data/Reaction-Completions'));
        bufferSize        = bufferSize  + reactionData.length;
        bufferSize2       = bufferSize2 + reactionData2.length;
        bufferSize3       = bufferSize3 + reactionData3.length;
        dataArray.push(reactionData);
        dataArray2.push(reactionData2);
        if (dataArray3.length > 1){
          bufferSize3 = bufferSize3 + comma.length;
          dataArray3.push(comma);
        }
        dataArray3.push(reactionData3);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.GUI') == "MUI" || atom.config.get('language-amigaos-c.highlightPrefs.GUI') == "MUI (with shortcut macros)") {
        var muiData  = fs.readFileSync(path.resolve(__dirname, '..', './data/MUI-Symbols'));
        var muiData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/MUI-FNC-Symbols'));
        var muiData3 = fs.readFileSync(path.resolve(__dirname, '..', './data/MUI-Completions'));
        bufferSize   = bufferSize  + muiData.length;
        bufferSize2  = bufferSize2 + muiData2.length;
        bufferSize3  = bufferSize3 + muiData3.length;
        dataArray.push(muiData);
        dataArray2.push(muiData2);
        if (dataArray3.length > 1){
          bufferSize3 = bufferSize3 + comma.length;
          dataArray3.push(comma);
        }
        dataArray3.push(muiData3);

        if (atom.config.get('language-amigaos-c.highlightPrefs.GUI') == "MUI (with shortcut macros)") {
          var muiData_SC  = fs.readFileSync(path.resolve(__dirname, '..', './data/MUI-Symbols-SC'));
          var muiData2_SC = fs.readFileSync(path.resolve(__dirname, '..', './data/MUI-FNC-Symbols-SC'));
          var muiData3_SC = fs.readFileSync(path.resolve(__dirname, '..', './data/MUI-Completions-SC'));
          bufferSize  = bufferSize  + muiData_SC.length;
          bufferSize2 = bufferSize2 + muiData2_SC.length;
          bufferSize3 = bufferSize3 + comma.length + muiData3_SC.length;
          dataArray.push(muiData_SC);
          dataArray2.push(muiData2_SC);
          dataArray3.push(comma);
          dataArray3.push(muiData3_SC);
        }
      }

      dataArray.push(outroData);
      dataArray2.push(outroData);
      dataArray3.push(outroData);
      dataArray4.push(outroData);

      //concatenate datas
      var data  = Buffer.concat(dataArray,  bufferSize);
      var data2 = Buffer.concat(dataArray2, bufferSize2);
      var data3 = Buffer.concat(dataArray3, bufferSize3);
      var data4 = Buffer.concat(dataArray4, bufferSize4);

      // Write the new grammar files
      fs.writeFileSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-FNC-Symbols.cson'), data2);
      fs.writeFileSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-Symbols.cson'), data);
      fs.writeFileSync(path.resolve(__dirname, '..', './completions/autoCompletions.JSON'), data3);
      fs.writeFileSync(path.resolve(__dirname, '..', './completions/fncContext.JSON'), data4);
    }
  }
};
