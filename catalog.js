(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WaseiCatalog = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // 『総合和声』の和音カタログ: 〈記号 × 旋法〉= 106 件。
  // 各 spec は主調 C（五度圏インデックス0）での solver 入力。構成音は持たない
  // ——deriveChord に計算させるので、core.js の導出が直れば表も自動で追従する。
  //
  // 出典: harmony リポジトリの data/stage_b_input.json（§3 全和音記号一覧が土台）。
  // 同期は harmony 側の data/verify_solver_catalog.py が検査する。手で編集しないこと。
  const CATALOG = [
    {
      "symbol": "I度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "I",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "I度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "I",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "I度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "I",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "I度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "I",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "II度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準II度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": "quasi",
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "II度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "II度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準II度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": "quasi",
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "II度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準ナポリII度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": "quasiNapoli",
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "ナポリII度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "II",
          "special": "napoli",
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "III度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "III",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "III度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "III",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "III度上変",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "III",
          "special": null,
          "form": {},
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "III度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "III",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "III度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "III",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VI度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "VI",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VI度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "VI",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VI度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "VI",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VI度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "VI",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VII度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "VII",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VII度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "VII",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VII度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "VII",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "VII度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "VII",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "ドリアIV度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "doric",
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "ドリアIV度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "doric",
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度7根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度7根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "ドリアIV度7根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "doric",
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度9",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度9",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "ドリアIV度9",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "doric",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度9根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度9根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "ドリアIV度9根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "doric",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加6",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add6": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加6",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add6": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加6",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add6": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加6-5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add6": true
          },
          "alteration": {},
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加6-5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add6": true
          },
          "alteration": {},
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加6-5省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add6": true
          },
          "alteration": {},
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加6上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add6": true
          },
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加6上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add6": true
          },
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加6上変5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add6": true
          },
          "alteration": {
            "up": true
          },
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加6上変5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add6": true
          },
          "alteration": {
            "up": true
          },
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加4",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add4": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加4",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add4": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加4",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add4": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加4-5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add4": true
          },
          "alteration": {},
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加4-5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add4": true
          },
          "alteration": {},
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加4-5省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add4": true
          },
          "alteration": {},
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加4上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add4": true
          },
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加4上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add4": true
          },
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度付加4上変5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": null,
          "form": {
            "add4": true
          },
          "alteration": {
            "up": true
          },
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準IV度付加4上変5省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "IV",
          "special": "quasi",
          "form": {
            "add4": true
          },
          "alteration": {
            "up": true
          },
          "omission": {
            "fifth": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度7根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度7根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度9",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準V度9",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度9",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度9根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準V度9根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度9根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {},
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度7上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度7上変根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {
            "up": true
          },
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度9上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準V度9上変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "up": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度9上変根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "up": true
          },
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "準V度9上変根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "up": true
          },
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {},
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度7根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度7根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度9",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度の準V度9",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度9",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度9根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度の準V度9根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度9根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度の準V度下変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {},
          "alteration": {
            "down": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度下変",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {},
          "alteration": {
            "down": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度の準V度7下変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true
          },
          "alteration": {
            "down": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度7下変",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {
            "down": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度の準V度7下変根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true
          },
          "alteration": {
            "down": true
          },
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度7下変根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {
            "down": true
          },
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度の準V度9下変",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "down": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度9下変",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "down": true
          },
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度の準V度9下変根省",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": "quasi",
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "down": true
          },
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "V度のV度9下変根省",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "V",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {
            "down": true
          },
          "omission": {
            "root": true
          },
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度のV度7",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "IV",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度のV度7",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "IV",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度のV度9",
      "mode": "major",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "major"
        },
        "innerChain": [
          {
            "degree": "IV",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    },
    {
      "symbol": "IV度のV度9",
      "mode": "minor",
      "spec": {
        "mainKey": {
          "index": 0,
          "quality": "minor"
        },
        "innerChain": [
          {
            "degree": "IV",
            "table": "auto",
            "forceQuality": null
          }
        ],
        "chord": {
          "degree": "V",
          "special": null,
          "form": {
            "seventh": true,
            "ninth": true
          },
          "alteration": {},
          "omission": {},
          "inversion": 0
        }
      }
    }
  ];

  return { CATALOG };
});
