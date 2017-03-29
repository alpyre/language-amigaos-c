var fs = require('fs');
var path = require('path');
var CompositeDisposable = require('atom').CompositeDisposable;
var provider = require('./autocomplete-provider');

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
          "order": 7
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
        "AHI": {
          "title": "Highlight AHI symbols",
          "type": "boolean",
          "default": false,
          "order": 2
        },
        "CGFX": {
          "title": "Highlight CyberGfx symbols",
          "type": "boolean",
          "default": false,
          "order": 3
        },
        "P96": {
          "title": "Highlight Picasso96 symbols",
          "type": "boolean",
          "default": false,
          "order": 4
        },
        "W3D": {
          "title": "Highlight Warp3D symbols",
          "type": "boolean",
          "default": false,
          "order": 5
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
          "order": 6
        },
        "obsolete": {
          "title": "Highlight obsolete symbols",
          "description": "Highlights obsolete symbols in warning colors. When disabled, these symbols will still be highlighted as regular because they are still defined in the SDK headers for backwards compatibility.",
          "type": "boolean",
          "default": false,
          "order": 9
        },
        "OS4": {
          "title": "Include OS4 symbols",
          "description": "Adds highlighting and autoComplete suggestions for OS4 symbols.",
          "type": "boolean",
          "default": false,
          "order": 10
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
          "description": "\"Smart\" automatically switches case sensitivity \"On\" and \"Off\" depending on the cursor location. It will switch case sensitivity \"On\" when you are typing function arguments and turn it back \"Off\" when the cursor is out of function argument paranthesis'.",
          "default": "Smart",
          "enum": [
            "On",
            "Off",
            "Smart"
          ],
          "order": 2
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
        if (fs.existsSync(grammarFile1)) fs.unlinkSync(grammarFile1);
        if (fs.existsSync(grammarFile2)) fs.unlinkSync(grammarFile2);
        if (fs.existsSync(completionsFile)) fs.unlinkSync(completionsFile);
      }
    ));

    /* NOTE: This function call is a temporary precaution  */
    /* and is intended to be removed in the future.        */
    /* please refer to the comments in its implementation! */
    this.removeGrammarsDir();

    this.createGrammar();
    atom.grammars.loadGrammarSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-FNC-Symbols.cson'));
    atom.grammars.loadGrammarSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-Symbols.cson'));
    provider.loadCompletions();
  },

  deactivate: function() {
    this.subscriptions.dispose();
  },

  provide: function() {
    return(provider);
  },

  createGrammar: function() {
    // if the grammar files does not exist create them
    if (!(fs.existsSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-Symbols.cson')))) {
      var introData    = fs.readFileSync(path.resolve(__dirname, '..', './data/_INTRO'));
      var introData2   = fs.readFileSync(path.resolve(__dirname, '..', './data/_INTRO-FNC'));
      var introData3   = Buffer.from("[\n");
      var outroData    = Buffer.from("]");
      var comma        = Buffer.from("\t,\n");
      var bufferSize   = introData.length + outroData.length;
      var bufferSize2  = introData2.length + outroData.length;
      var bufferSize3  = introData3.length + outroData.length;
      var dataArray    = [introData];
      var dataArray2   = [introData2];
      var dataArray3   = [introData3];

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
        bufferSize   = bufferSize  + sdkData.length;
        bufferSize2  = bufferSize2 + sdkData2.length;
        bufferSize3  = bufferSize3 + sdkData3.length;
        dataArray.push(sdkData);
        dataArray2.push(sdkData2);
        dataArray3.push(sdkData3);
        if (atom.config.get('language-amigaos-c.highlightPrefs.OS4')) {
          var sdkOS4Data3 = fs.readFileSync(path.resolve(__dirname, '..', './data/OS4-SDK-Completions'));
          bufferSize3  = bufferSize3 + sdkOS4Data3.length + comma.length;
          dataArray3.push(comma);
          dataArray3.push(sdkOS4Data3);
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
      if (atom.config.get('language-amigaos-c.highlightPrefs.AHI')) {
        if (atom.config.get('language-amigaos-c.highlightPrefs.obsolete')) {
          var ahiObs  = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-Obsolete-Symbols'));
          bufferSize  = bufferSize  + ahiObs.length;
          dataArray.push(ahiObs);
        }
        var ahiData  = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-Symbols'));
        var ahiData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-FNC-Symbols'));
        var ahiData3 = fs.readFileSync(path.resolve(__dirname, '..', './data/AHI-Completions'));
        bufferSize   = bufferSize  + ahiData.length;
        bufferSize2  = bufferSize2 + ahiData2.length;
        bufferSize3  = bufferSize3 + ahiData3.length;
        dataArray.push(ahiData);
        dataArray2.push(ahiData2);
        if (dataArray3.length > 1){
          bufferSize3 = bufferSize3 + comma.length;
          dataArray3.push(comma);
        }
        dataArray3.push(ahiData3);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.CGFX')) {
        var cgfxData  = fs.readFileSync(path.resolve(__dirname, '..', './data/CyberGfx-Symbols'));
        var cgfxData2 = fs.readFileSync(path.resolve(__dirname, '..', './data/CyberGfx-FNC-Symbols'));
        bufferSize   = bufferSize  + cgfxData.length;
        bufferSize2  = bufferSize2 + cgfxData2.length;
        dataArray.push(cgfxData);
        dataArray2.push(cgfxData2);
      }
      if (atom.config.get('language-amigaos-c.highlightPrefs.P96')) {
        var p96Data  = fs.readFileSync(path.resolve(__dirname, '..', './data/P96-Symbols'));
        var p96Data2 = fs.readFileSync(path.resolve(__dirname, '..', './data/P96-FNC-Symbols'));
        bufferSize   = bufferSize  + p96Data.length;
        bufferSize2  = bufferSize2 + p96Data2.length;
        dataArray.push(p96Data);
        dataArray2.push(p96Data2);
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

      //concatenate datas
      var data  = Buffer.concat(dataArray,  bufferSize);
      var data2 = Buffer.concat(dataArray2, bufferSize2);
      var data3 = Buffer.concat(dataArray3, bufferSize3);

      // Write the new grammar files
      fs.writeFileSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-FNC-Symbols.cson'), data2);
      fs.writeFileSync(path.resolve(__dirname, '..', './grammar/amigaos-SDK-Symbols.cson'), data);
      fs.writeFileSync(path.resolve(__dirname, '..', './completions/autoCompletions.JSON'), data3);
    }
  },

  removeGrammarsDir: function() {
  /* Before v1.1.2 the grammar files were created into the "grammars" directory
   * to be loaded by Atom automatically. This used to cause racing conditions
   * and even multiple loads sometimes. To fix that I've renamed the "grammars"
   * directory as "grammar" so that Atom won't bother loading them (and made the
   * package load its grammars by itself of course).
   * Since I didn't know if the package updater would delete that left over
   * "grammars" directory in users installations who update from prior versions,
   * I've decided to write this function to delete it if not. I'd not risk it!

   * Of course once the mentioned "grammars" directories are all deleted from
   * user installations, this function will be quite unnecessary.
   * It should be removed then.
   *
   * SO! THIS IS A NOTE TO MYSELF!
   * REMOVE THIS FUNCTION AFTER A TIME ENOUGH FOR ALL USERS TO
   * HAVE THEIR PACKAGES UPDATED OVER 1.1.2  */
    if (fs.existsSync(path.resolve(__dirname, '..', './grammars')))
    {
      //delete all the files inside (hoping noone put other files inside :D )
      var grammarFile1 = path.resolve(__dirname, '..', './grammars/amigaos-SDK-Symbols.cson');
      var grammarFile2 = path.resolve(__dirname, '..', './grammars/amigaos-SDK-FNC-Symbols.cson');
      var readmeFile   = path.resolve(__dirname, '..', './grammars/readme.txt');
      if (fs.existsSync(grammarFile1)) fs.unlinkSync(grammarFile1);
      if (fs.existsSync(grammarFile2)) fs.unlinkSync(grammarFile2);
      if (fs.existsSync(readmeFile))   fs.unlinkSync(readmeFile);
      //delete the directory itself
      fs.rmdir(path.resolve(__dirname, '..', './grammars'));
    }
  }
};
