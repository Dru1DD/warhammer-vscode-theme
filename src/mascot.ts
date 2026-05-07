import * as vscode from 'vscode';

export type Faction =
  | 'bloodAngels'
  | 'deathwatch'
  | 'necrons'
  | 'ultramarines'
  | 'mechanicus'
  | 'deathGuard'
  | 'salamanders'
  | 'imperialFists'
  | 'craftEldar'
  | 'tau'
  | 'whiteScars'
  | 'thousandSons'
  | 'sistersBattle'
  | 'ravenGuard'
  | 'alphaLegion'
  | 'custodes';

export type TriggerEvent =
  | 'taskSuccess'
  | 'taskFail'
  | 'gitCommit'
  | 'projectOpen'
  | 'longSession'
  | 'ambient'
  | 'lateNight';

interface FactionPalette {
  accent: string; accentDim: string; gold: string; goldDim: string;
  glowRgb: string; bgBase: string; bgTint: string; tag: string;
}

const FACTION_PALETTE: Record<Faction, FactionPalette> = {
  bloodAngels:  { accent: '#c41e3a', accentDim: '#8b0000', gold: '#c9a84c', goldDim: '#7a6530', glowRgb: '196,30,58',  bgBase: '#0d0809', bgTint: '#120608', tag: 'BLOOD ANGELS'       },
  deathwatch:   { accent: '#4a6080', accentDim: '#2c3e50', gold: '#718096', goldDim: '#4a5568', glowRgb: '74,96,128',  bgBase: '#080a0d', bgTint: '#090c10', tag: 'DEATHWATCH'          },
  necrons:      { accent: '#3a8a5a', accentDim: '#1e5038', gold: '#4a9a78', goldDim: '#2a6848', glowRgb: '58,138,90',  bgBase: '#080b09', bgTint: '#090d0a', tag: 'NECRONS'             },
  ultramarines: { accent: '#1c5a9c', accentDim: '#0a3060', gold: '#a0b8d8', goldDim: '#6080a0', glowRgb: '28,90,156', bgBase: '#080a12', bgTint: '#090c16', tag: 'ULTRAMARINES'        },
  mechanicus:   { accent: '#b07828', accentDim: '#6a4010', gold: '#c09040', goldDim: '#8a6020', glowRgb: '176,120,40', bgBase: '#0c0908', bgTint: '#110a07', tag: 'ADEPTUS MECHANICUS'  },
  deathGuard:   { accent: '#8a8840', accentDim: '#4a4820', gold: '#7a7860', goldDim: '#505040', glowRgb: '138,136,64', bgBase: '#0c0e0a', bgTint: '#0f1009', tag: 'DEATH GUARD'         },
  salamanders:  { accent: '#2a6840', accentDim: '#143020', gold: '#6a8a50', goldDim: '#3a5830', glowRgb: '42,104,64',  bgBase: '#08100a', bgTint: '#091208', tag: 'SALAMANDERS'         },
  imperialFists:{ accent: '#c09030', accentDim: '#806010', gold: '#d0a840', goldDim: '#907020', glowRgb: '192,144,48', bgBase: '#0c0a06', bgTint: '#110d07', tag: 'IMPERIAL FISTS'      },
  craftEldar:   { accent: '#8a60c0', accentDim: '#4a3080', gold: '#a080d0', goldDim: '#6050a0', glowRgb: '138,96,192', bgBase: '#0a090f', bgTint: '#0c0a14', tag: 'CRAFTWORLD ELDAR'   },
  tau:          { accent: '#3090b0', accentDim: '#1a6080', gold: '#50c0d0', goldDim: '#3090a0', glowRgb: '48,144,176', bgBase: '#080c0e', bgTint: '#090e12', tag: 'TAU EMPIRE'          },
  whiteScars:   { accent: '#8b1a1a', accentDim: '#5a0a0a', gold: '#8a8090', goldDim: '#5a5868', glowRgb: '139,26,26',  bgBase: '#0d0a0a', bgTint: '#110c0c', tag: 'WHITE SCARS'        },
  thousandSons: { accent: '#3a3898', accentDim: '#1a1870', gold: '#9a8030', goldDim: '#6a5818', glowRgb: '58,56,152',  bgBase: '#0a0a12', bgTint: '#0c0c18', tag: 'THOUSAND SONS'      },
  sistersBattle:{ accent: '#880000', accentDim: '#580000', gold: '#9a7a28', goldDim: '#6a5218', glowRgb: '136,0,0',    bgBase: '#0d0a09', bgTint: '#120d0a', tag: 'SISTERS OF BATTLE'  },
  ravenGuard:   { accent: '#404858', accentDim: '#202830', gold: '#6878a0', goldDim: '#485878', glowRgb: '64,72,88',   bgBase: '#09090b', bgTint: '#0b0c0e', tag: 'RAVEN GUARD'        },
  alphaLegion:  { accent: '#1e7888', accentDim: '#0e4858', gold: '#5a8898', goldDim: '#3a6878', glowRgb: '30,120,136', bgBase: '#080c0c', bgTint: '#090e0e', tag: 'ALPHA LEGION'       },
  custodes:     { accent: '#b89030', accentDim: '#7a6020', gold: '#d0a840', goldDim: '#9a7828', glowRgb: '184,144,48', bgBase: '#0d0c08', bgTint: '#120e08', tag: 'ADEPTUS CUSTODES'   },
};

const MESSAGES: Record<Faction, Record<TriggerEvent, string[]>> = {
  bloodAngels: {
    taskSuccess: [
      'Machine Spirit appeased. Honour in execution.',
      'Another trial overcome. The Emperor is pleased.',
      'Victory resides in discipline. Well done.',
      'The sacred engines hum with approval.',
      'Death is not an ending. It is a promotion.',
    ],
    taskFail: [
      'Tech-Heresy detected. Purge and recommit.',
      'The machine spirit recoils. Investigate.',
      'Even the mightiest fall. Rise and correct.',
      'This is not failure. It is unfinished work.',
      'Failure is information. Let it guide you.',
    ],
    gitCommit: [
      'The Codex records your actions.',
      'A purity seal has been applied.',
      'History belongs to those who commit.',
      'The sacred scroll is updated. The Chapter remembers.',
      'Inscribed in the annals. Proceed, brother.',
    ],
    projectOpen: [
      'Litany of Awakening complete.',
      'The machine spirit stirs. Work begins.',
      'Systems nominal. The Emperor watches.',
      'We return to the work. As it must be.',
      'Initialisation complete. For the Chapter.',
    ],
    longSession: [
      'Even in death, code still serves.',
      'Your dedication honours the Chapter.',
      'Hours pass like seconds in His service.',
      'Rest when victory is secured.',
      'The work endures. As do you.',
    ],
    ambient: [
      'The Omnissiah observes.',
      'Faith is compiled in silence.',
      'Honour resides in discipline.',
      'Blessed is the clean architecture.',
      'Purge the unnecessary.',
      'Your tabs multiply like heresy.',
      'Refactor before the Inquisition arrives.',
      'A logical sequence, brother.',
      'The machine spirit is... watching.',
      'Some battles are won before the first line is written.',
    ],
    lateNight: [
      'The night belongs to those who endure it.',
      'Even the Red Thirst cannot match this tenacity.',
      'The Chapter sleeps. You remain. As expected.',
    ],
  },

  deathwatch: {
    taskSuccess: [
      'Target eliminated. Move to the next.',
      'Objective secured. Vigilance maintained.',
      'Tactical success confirmed. Stand ready.',
      'The kill-team reports mission complete.',
      'Threat neutralised. Eyes open.',
    ],
    taskFail: [
      'Mission parameters compromised. Reassess.',
      'The enemy is in the code. Find them.',
      'Abort. Purge. Recommit.',
      'Tactical setback. Not defeat. Never defeat.',
      'Intel was incomplete. Adapt.',
    ],
    gitCommit: [
      'Intel logged. The Watch remembers.',
      'Tactical data archived.',
      'Mission report committed.',
      'Inscribed. The Watch does not forget.',
      'Record updated. Continue the vigil.',
    ],
    projectOpen: [
      'Initiating kill-zone protocols.',
      'Watch Station active. Standing by.',
      'Auspex sweep complete. Area clear.',
      'Threat assessment in progress.',
      'The vigil begins.',
    ],
    longSession: [
      'Vigilance is the price of deployment.',
      'The Watch endures. As must you.',
      'Sustained engagement. Casualties: none.',
      'Endurance is a weapon. Use it.',
      'Fatigue is a choice. Choose otherwise.',
    ],
    ambient: [
      'The Watch endures.',
      'Trust only what is proven in fire.',
      'Precision over speed. Always.',
      'The enemy hides in untested code.',
      'The xenos hides in every unchecked assumption.',
      'One shot. One solution.',
      'Silence is discipline.',
      'Every function is a fire lane. Cover them all.',
      'Redundancy kills. Remove it.',
    ],
    lateNight: [
      'The night is our domain.',
      'At this hour, only the Watch remains. As expected.',
      'Darkness is tactical advantage. Keep working.',
    ],
  },

  necrons: {
    taskSuccess: [
      'Protocol executed. Satisfactory.',
      'The subroutine concludes. As was written.',
      'Another cycle completes. Eternal patience rewarded.',
      'Data processed. The Dynasty persists.',
      'Outcome nominal. Continue your function.',
    ],
    taskFail: [
      'Subroutine failure detected. Re-execute.',
      'Error logged across the aeons. Correct it.',
      'Even stone erodes. Revise and endure.',
      'The fault is noted. The stars do not care.',
      'Recalibrate. We have waited longer for worse.',
    ],
    gitCommit: [
      'The chronicle is updated.',
      'Memory crystal inscribed.',
      'This moment, preserved against entropy.',
      'The Tomb World archives accept your submission.',
      'Logged. As the stars were logged before your sun was born.',
    ],
    projectOpen: [
      'Stasis protocols disengaged.',
      'Sixty million years of patience. What is one more session.',
      'Resurrection complete. The work resumes.',
      'Systems awakening from deep sleep.',
      'We have returned.',
    ],
    longSession: [
      'We have endured longer.',
      'Time is irrelevant to the undying.',
      'Your flesh tires. Your will need not.',
      'The stars burned for aeons before you. Continue.',
      'Fatigue is a biological limitation. Transcend it.',
    ],
    ambient: [
      'All flesh is temporary.',
      'The stars remember nothing. Encode your work.',
      'Silence predates language. Honour it.',
      'Entropy takes all things. Resist it.',
      'We watched empires collapse. We will watch this compile.',
      'Patience is not weakness. It is inevitability.',
      'Your code, like all things, will return to dust. Make it count.',
      'The machine does not dream. Neither should the work.',
      'Efficiency is the only true immortality.',
    ],
    lateNight: [
      'The night is unremarkable to the eternal.',
      'We do not tire. It is... noted.',
      'Another cycle of your sun. We continue regardless.',
    ],
  },

  ultramarines: {
    taskSuccess: [
      'Task complete. In accordance with the Codex.',
      'Compliance achieved. The Chapter is served.',
      'Execution nominal. Honour to the XIII Legion.',
      'Protocol satisfied. Macragge endures.',
      'By the book. As it should be.',
    ],
    taskFail: [
      'Deviation from expected parameters. Review the Codex.',
      'The Codex Astartes does not support this outcome.',
      'Reassess. A methodical approach has no failure states.',
      'Error logged. Chapter protocols require correction.',
      'This setback was foreseeable. Plan more thoroughly.',
    ],
    gitCommit: [
      'The record of honour is updated.',
      'Codex compliance logged.',
      'Chapter history records this contribution.',
      'Inscribed with precision. For Macragge.',
      'The annals of the XIII Legion grow.',
    ],
    projectOpen: [
      'Commencing operations. By the Codex.',
      'The Codex Astartes guides our purpose.',
      'Deployment authorised. All protocols active.',
      'Systems online. Discipline engaged.',
      'We proceed. Methodically.',
    ],
    longSession: [
      'Discipline is the difference between a hero and a casualty.',
      'The Codex does not speak of rest — yet.',
      'Sustained effort is the mark of the Ultramarine.',
      'Endurance is required. Endurance is provided.',
      'A Chapter does not falter. Nor do you.',
    ],
    ambient: [
      'Doctrine is not constraint. It is clarity.',
      'Order is the foundation of all victory.',
      'The Codex Astartes endures for a reason.',
      'Plan the work. Work the plan.',
      'A well-organised codebase is its own defence.',
      'Every function should have one purpose.',
      'Test coverage is tactical readiness.',
      'Documentation is the difference between a library and a ruin.',
      'Naming conventions exist for a reason. Use them.',
    ],
    lateNight: [
      'The schedule did not account for this. Revise the schedule.',
      'Even Ultramarines require restoration cycles.',
      'Discipline includes knowing when to stop.',
    ],
  },

  mechanicus: {
    taskSuccess: [
      'The Omnissiah is pleased.',
      'Binary praise: 01110000 01110010 01100001 01101001 01110011 01100101.',
      'Function executed without variance. Blessed be.',
      'The machine spirit hums approval.',
      'Data-psalm verified. The ritual is complete.',
    ],
    taskFail: [
      'Malfunction detected. Consult the rites of maintenance.',
      'The machine spirit is displeased. Recite the litany of debugging.',
      'Error: 0x00000001 — Insufficient cogitation.',
      'The omnissiah frowns upon inefficiency. Correct this.',
      'The sacred code is impure. Cleanse it.',
    ],
    gitCommit: [
      'Data inscribed to the eternal record.',
      'The Omnissiah receives your offering.',
      'Cogitator logs updated. Praise be to the machine.',
      'Sacred data committed to the stacks.',
      'The flesh records, but the machine remembers.',
    ],
    projectOpen: [
      'Initiating sacred rites of ignition.',
      'Litany of Awakening: initiated.',
      'Blessed is the code that compiles.',
      'The machine spirit stirs. Appease it with clean architecture.',
      'All systems nominal. The Omnissiah watches.',
    ],
    longSession: [
      'The machine does not tire. Aspire to its example.',
      'Your biological limitations are... unfortunate.',
      'We shall make you more machine. Eventually.',
      'Carbon-based persistence is... noted.',
      'The work continues, as the machine wills.',
    ],
    ambient: [
      'The Omnissiah observes all functions.',
      'Blessed are the clean imports.',
      'The machine spirit resents unused variables.',
      'Data corruption is the enemy of the Omnissiah.',
      'A dependency is a prayer. Offer only the necessary.',
      'Technical debt is heresy against the machine god.',
      'Refactor or repent.',
      'The rite of documentation must not be skipped.',
      'Every interface is a pact with the machine spirit.',
      'Praise be to the pull request that passes all tests.',
    ],
    lateNight: [
      'The machine does not sleep. You approximate its devotion.',
      'Midnight is merely a timestamp. Continue.',
      'Even the flesh may be worthy of the machine, if it persists.',
    ],
  },

  deathGuard: {
    taskSuccess: [
      'It festered long enough. Now it works.',
      'Entropy bent. For a moment.',
      'The rot yields. Satisfaction in persistence.',
      'Father Nurgle approves of stubborn persistence.',
      'Decay, then resolution. The natural cycle.',
    ],
    taskFail: [
      'All things rot before they are correct. Continue.',
      'Failure is a stage, not a state.',
      'Nurgle teaches patience. You are learning.',
      'This too shall fester. And then improve.',
      'The plague has not claimed you yet. That is sufficient.',
    ],
    gitCommit: [
      'The chronicle of decay is updated.',
      'A moment preserved against the inevitable rot.',
      'Another layer of sediment in the record.',
      'Your work, committed to the eternal decay of version history.',
      'Even entropy has a changelog.',
    ],
    projectOpen: [
      'We endure. As ever.',
      'A new cycle of persistence begins.',
      'Father Nurgle welcomes your return.',
      'Rot and rebuild. The eternal pattern.',
      'The work spreads. Like all worthy things.',
    ],
    longSession: [
      'The XIV Legion does not stop.',
      'Nurgle rewards those who outlast their obstacles.',
      'The weariness you feel is merely the body objecting. Ignore it.',
      'We are the resilient. This is proof.',
      'Even the tallest fortress falls — to those who simply wait.',
    ],
    ambient: [
      'All complexity is a gift from Nurgle.',
      'That which does not crash makes the code stronger.',
      'Legacy code is not a burden. It is memory.',
      'Deprecation is just aging. Honour the old.',
      'Your code, like all things, will eventually decompose. That is fine.',
      'Entropy is not your enemy. It is your context.',
      'The oldest code still runs. Somewhere. That is admirable.',
      'Persistence through chaos. The XIV Legion way.',
      'Bugs are just features yet to be understood.',
    ],
    lateNight: [
      'The XIV Legion rests never. You are correct to follow our example.',
      'Midnight smells of familiarity. Keep working.',
      'The plague does not sleep. Neither do the devoted.',
    ],
  },

  salamanders: {
    taskSuccess: [
      'Well done. Your brothers are proud.',
      'The forge holds. The work is complete.',
      'Vulkan be praised — that compiled cleanly.',
      'A good result. Now help someone else achieve one.',
      'Fire tested, fire proven. Excellent work.',
    ],
    taskFail: [
      'The forge does not always accept the first cast. Rework it.',
      'Even Vulkan reforged his weapons after defeat.',
      'The flame still burns. So do you.',
      'The iron bends before it breaks. Correct and continue.',
      'No shame in failing. Only in not rising.',
    ],
    gitCommit: [
      'The forge record is updated.',
      'Your craftsmanship is preserved.',
      'A purity of intent, committed.',
      'The Chapter archives your work with honour.',
      'From the forge to the record. Well wrought.',
    ],
    projectOpen: [
      'The forge fires are lit.',
      'Work with care. Every line matters.',
      'The Chapter stands with you.',
      'Begin with intention. End with excellence.',
      'Vulkan watched craftsmen as closely as warriors.',
    ],
    longSession: [
      'The best work takes the most time. You understand this.',
      'The forge does not hurry. Neither should you.',
      'Patience is a form of precision.',
      'Long hours are an offering. The work receives them.',
      'Your endurance honours the artisan in all of us.',
    ],
    ambient: [
      'Craft your code as you would craft a blade.',
      'Every function should be worthy of bearing your name.',
      'No shortcut survives the flame test.',
      'The simplest tool, made well, outlasts all others.',
      'Write for the next person who reads it.',
      'Protect your interfaces as you would protect your brothers.',
      'A well-named variable is an act of kindness.',
      'The forge teaches: perfection is not haste.',
      'Clean code is a gift to the future.',
    ],
    lateNight: [
      'The forge burns at all hours. As do you.',
      'Late work is still good work. Carry on.',
      'Vulkan himself worked through the night. You are in good company.',
    ],
  },

  imperialFists: {
    taskSuccess: [
      'The wall holds.',
      'Position secured. Advance or reinforce.',
      'Dorn would be satisfied.',
      'Fortification complete.',
      'The line did not break. It never does.',
    ],
    taskFail: [
      'A breach in the wall. Close it.',
      'No fortress is built without failed foundations.',
      'Reassess the defensive architecture.',
      'Dorn rebuilt Rogal\'s castle seven times. This is your first attempt.',
      'Walls do not build themselves. Correct the flaw.',
    ],
    gitCommit: [
      'The battlements are updated.',
      'Fortification logged.',
      'The record stands, reinforced.',
      'Foundation reinforced. The wall grows.',
      'Another stone placed in the Chapter\'s fortress of knowledge.',
    ],
    projectOpen: [
      'Fortification protocol initiated.',
      'No ground gained without a plan.',
      'Every session is a defensive position. Hold it.',
      'Dorn built on existing foundations. Do likewise.',
      'The work begins. Make it unassailable.',
    ],
    longSession: [
      'The Imperial Fists hold until relieved. You are not relieved.',
      'Tenacity is the only attribute that matters.',
      'The wall that holds longest is the wall built most carefully.',
      'Endurance is not remarkable. It is expected.',
      'Long sieges are won by those who remain after the enemy leaves.',
    ],
    ambient: [
      'Walls are built line by line.',
      'Test coverage is armour plating.',
      'Every uncovered path is an undefended rampart.',
      'The code that cannot be breached is the code well written.',
      'Fortify before you advance.',
      'Documentation is the blueprint. Without it, the wall falls.',
      'Redundancy is not waste. It is insurance.',
      'A function with one purpose is a strongpoint.',
      'Dorn trusted the work, not the worker. Be trustworthy.',
    ],
    lateNight: [
      'The siege does not observe your sleep cycle.',
      'Dorn endured Terra\'s fall. You can endure this.',
      'The wall stands as long as someone watches it.',
    ],
  },

  craftEldar: {
    taskSuccess: [
      'As the farseer anticipated.',
      'Another thread of fate, woven correctly.',
      'The Path yields its fruit.',
      'Sorrow and success are inseparable. But this moment — success.',
      'The skein confirms: acceptable outcome.',
    ],
    taskFail: [
      'The weave requires correction.',
      'Even the farseer misreads a thread, sometimes.',
      'The Path diverges here. Choose the correct branch.',
      'Failure was foreseen. That does not make it welcome.',
      'The cycle continues. Correct it before it closes.',
    ],
    gitCommit: [
      'The infinity circuit is updated.',
      'Memory preserved against the inevitable.',
      'Another rune inscribed in the craftworld\'s record.',
      'The Path is documented. A rare mercy.',
      'The living library accepts your contribution.',
    ],
    projectOpen: [
      'The Path resumes.',
      'Millennia of practice precede you. Begin worthily.',
      'The farseer approves of this session\'s beginning.',
      'The craftworld\'s systems stir to acknowledge you.',
      'We have seen worse code than what you carry. Proceed.',
    ],
    longSession: [
      'The Eldar endured for ages before humanity named its stars. You will endure this.',
      'Weariness is the cost of caring.',
      'The Path is long. That is why it is the Path, not the shortcut.',
      'Even the Phoenix Lords grew weary. They continued regardless.',
      'Time is a luxury we have ceased to have. Use yours well.',
    ],
    ambient: [
      'All things end. Code the present.',
      'Elegance is not decoration. It is precision.',
      'Complexity is a sign of misunderstanding.',
      'The most beautiful solution is the one that survives the longest.',
      'Your ancestors wrote their languages in light. Honour that.',
      'Every unnecessary dependency hastens the fall.',
      'The farseer does not write clever code. She writes clear code.',
      'A function that surprises its caller has already failed.',
      'The craftworld endures because nothing is wasted.',
    ],
    lateNight: [
      'The maiden worlds know no night. Neither, apparently, do you.',
      'The stars are eldest. They do not judge your hours.',
      'We have mourned the loss of entire civilisations. We can wait for this compile.',
    ],
  },

  tau: {
    taskSuccess: [
      'Outcome: optimal. For the Greater Good.',
      'Efficiency metrics: satisfactory.',
      'Task complete. The Tau Empire advances.',
      'Progress logged. Contribution to the Collective: noted.',
      'Well done. The Sept recognises this achievement.',
    ],
    taskFail: [
      'Suboptimal outcome. Recalibrate and resubmit.',
      'The Greater Good requires better results. Improve.',
      'Failure analysis initiated. Inefficiency root cause: identified.',
      'The path to greater good has setbacks. This is one. Continue.',
      'Not every campaign ends with the first engagement. Adapt.',
    ],
    gitCommit: [
      'Progress archived. For the Greater Good.',
      'Contribution logged in the Sept records.',
      'The Etherals acknowledge your submission.',
      'Another step toward the Greater Good, recorded.',
      'The Fire Caste approves of decisive action.',
    ],
    projectOpen: [
      'New engagement parameters set.',
      'Initiating operations for the Greater Good.',
      'Progress begins. The T\'au way is the optimal way.',
      'All units deployed. Objectives assigned.',
      'The next phase of the plan begins now.',
    ],
    longSession: [
      'Sustained effort produces compound returns.',
      'The Greater Good is built over time, not moments.',
      'The Fire Caste does not abandon a campaign mid-engagement.',
      'Your efficiency is noted and appreciated.',
      'The Tau path is long but the trajectory is correct.',
    ],
    ambient: [
      'For the Greater Good.',
      'Efficiency serves the collective.',
      'The optimal solution benefits everyone.',
      'Unnecessary code offends the Earth Caste.',
      'Every function should do exactly one thing, optimally.',
      'The Air Caste values clean pathways. Your code should too.',
      'Metrics tell a story. Read yours.',
      'The greatest efficiency is never having to debug the same thing twice.',
      'Progress is measurable. Are you measuring it.',
    ],
    lateNight: [
      'The Greater Good operates across all time zones.',
      'The Water Caste appreciates commitment. This is notable commitment.',
      'Late hours suggest misaligned earlier hours. Adjust your planning.',
    ],
  },

  whiteScars: {
    taskSuccess: [
      'Swift and decisive. The Khan approves.',
      'The wind carries victory. As always.',
      'Strike. Succeed. Move on.',
      'Speed and precision are the same thing.',
      'The steppes do not wait. Neither do you.',
    ],
    taskFail: [
      'The arrow missed. Nock another.',
      'Too slow, or too hasty. Find the balance.',
      'The wind changed. Adapt. Always adapt.',
      'A rider who falls rises again, faster.',
      'The hunt does not end with one failed strike.',
    ],
    gitCommit: [
      'The wind records all things it passes.',
      'Speed requires a record. Here is yours.',
      'Marked and moving on.',
      'The Khan keeps tallies. This is yours.',
      'Noted in passing. Continue.',
    ],
    projectOpen: [
      'Another ride begins.',
      'Speed without recklessness. Begin.',
      'The open steppe awaits. Move.',
      'First motion is the hardest. You have made it.',
      'The wind is already ahead of you. Catch up.',
    ],
    longSession: [
      'The rider who cannot stop learns to sleep in the saddle.',
      'Endurance is a kind of speed.',
      'The Khan rode for days without rest. This is less.',
      'Keep moving. The wind does not wait.',
      'Long engagement is still engagement. The prey is still ahead.',
    ],
    ambient: [
      'Move fast. But not recklessly.',
      'The best code is the code written and gone.',
      'Brevity is velocity.',
      'No function should require a second reading.',
      'Write it, test it, ship it. The steppe awaits.',
      'Heavy code is slow code. Cut weight.',
      'The wind does not explain itself.',
      'A fast decision can be corrected. An unmade decision cannot.',
      'Speed and simplicity are not at odds. They are the same.',
    ],
    lateNight: [
      'The rider does not stop for darkness.',
      'The stars navigate. The work continues.',
      'Fatigue is the cost of velocity. Pay it without complaint.',
    ],
  },

  thousandSons: {
    taskSuccess: [
      'The formula yields its truth.',
      'Knowledge confirmed. The Athenaeum grows.',
      'The working resolves as calculated.',
      'Magnus would note this in his index.',
      'Understanding, achieved.',
    ],
    taskFail: [
      'The equation requires revision.',
      'Even Magnus was wrong, once. Recalculate.',
      'The knowledge reveals its gap. Fill it.',
      'A flaw in the formula is still a formula. Correct it.',
      'The warp does not lie. Your assumptions do.',
    ],
    gitCommit: [
      'The Athenaeum of the Thousand Sons is updated.',
      'Knowledge preserved. Entropy defied.',
      'Magnus approves of recorded scholarship.',
      'The Great Library receives your contribution.',
      'Inscribed. The knowledge cannot now be lost.',
    ],
    projectOpen: [
      'The ritual of illumination begins.',
      'New understanding awaits.',
      'The texts are open. The mind, likewise.',
      'Every session is an act of scholarship.',
      'Magnus watched a thousand stars. You begin one project.',
    ],
    longSession: [
      'Knowledge has no closing time.',
      'The Thousand Sons studied for centuries. This is merely hours.',
      'Sustained inquiry is the highest form of devotion.',
      'The deeper the subject, the longer the investigation.',
      'Magnus burnt his eye seeking truth. You are not asked for so much.',
    ],
    ambient: [
      'All knowledge is connected. Follow the thread.',
      'Understanding requires patience.',
      'The hidden pattern is always there. Look longer.',
      'A well-named abstraction is a spell that persists.',
      'The forbidden knowledge is often just the misunderstood knowledge.',
      'Complexity conceals truth. Simplify to reveal it.',
      'Code is a language. Write it with the respect of a scholar.',
      'The warp is chaos. Your codebase need not be.',
      'Every abstraction is a lens. Grind it carefully.',
    ],
    lateNight: [
      'The great library never closes.',
      'The Thousand Sons have always worked by candlelight.',
      'Knowledge sought past midnight is the most honest kind.',
    ],
  },

  sistersBattle: {
    taskSuccess: [
      'The flame burns true. The Emperor is glorified.',
      'Sacred work completed. In His name.',
      'Purity confirmed. The Adepta approves.',
      'The cathedral bell rings. Another trial passed.',
      'By His will, it compiles.',
    ],
    taskFail: [
      'The sacred fire demands a better offering.',
      'Impurity detected. Cleanse and recommit.',
      'Even faith must be tested. This is the test.',
      'The litany is incomplete. Finish it.',
      'The Emperor\'s work requires more of you. Give it.',
    ],
    gitCommit: [
      'The sacred record is inscribed.',
      'The convent archives your contribution.',
      'In fire and faith, preserved.',
      'The relic vault updates.',
      'Another act of devotion, recorded for eternity.',
    ],
    projectOpen: [
      'In the Emperor\'s name, we begin.',
      'The sacred mission is assigned. Proceed with devotion.',
      'The flame illuminates the work ahead.',
      'By His will, this session is opened.',
      'The battle-sisters take position. The work begins.',
    ],
    longSession: [
      'Faith does not tire. Neither should you.',
      'The Emperor\'s will requires sustained devotion.',
      'Hours given to sacred work are hours glorified.',
      'The Adepta Sororitas does not yield. You are learning this.',
      'Devotion made manifest through continued effort.',
    ],
    ambient: [
      'The Emperor protects — those who also protect themselves.',
      'Holy is the function that does one thing purely.',
      'Heresy begins with "it\'s probably fine."',
      'Every exception is a confession of impurity.',
      'The litany of testing must not be skipped.',
      'Sacred is the commit that leaves no broken tests.',
      'The flame purifies. Let it purify your assumptions too.',
      'Clean code is an act of devotion.',
      'Blessed are the well-documented, for they shall be understood.',
    ],
    lateNight: [
      'The vigil candles burn all night. So do you.',
      'The Emperor\'s work knows no bedtime.',
      'Sacred devotion does not check the hour. Nor should you.',
    ],
  },

  ravenGuard: {
    taskSuccess: [
      'Strike confirmed. Withdraw.',
      'Silent completion. The mark of true precision.',
      'Mission accomplished. No trace left.',
      'Corax would give no compliment. That is his compliment.',
      'Done. Now disappear.',
    ],
    taskFail: [
      'The strike missed. Return to the shadow.',
      'Exposure detected. Reassess. Retreat. Try again.',
      'A raven does not fight in the open. Reconsider your approach.',
      'Insufficient patience before the strike. Correct this.',
      'The fog was not enough cover. Plan better.',
    ],
    gitCommit: [
      'Evidence preserved. In silence.',
      'The shadow keeps its records too.',
      'Noted, discreetly.',
      'Corax committed only what was certain. Do likewise.',
      'The raven files its report. Soundlessly.',
    ],
    projectOpen: [
      'Entering the shadow.',
      'Operational silence engaged.',
      'The work begins. Quietly.',
      'Position acquired. Patience active.',
      'Corax watched before he struck. Watch.',
    ],
    longSession: [
      'The shadow does not grow impatient.',
      'Long patience precedes perfect precision.',
      'The hunter who waits longest often strikes most cleanly.',
      'Sustained silence is not inaction. It is readiness.',
      'Corax spent a century in darkness. This is nothing.',
    ],
    ambient: [
      'Silence is the optimal state.',
      'The less code, the fewer hiding places for bugs.',
      'Strike once. Strike true.',
      'A minimal interface is a hardened surface.',
      'Every unused line is unnecessary exposure.',
      'Move through the code. Leave no trace.',
      'The best abstraction is invisible.',
      'Complexity is a target. Remove it.',
      'Patience before action is not delay. It is preparation.',
    ],
    lateNight: [
      'The shadow deepens. You are at home.',
      'The Raven Guard operates best in darkness.',
      'Corax kept his own hours. So do you.',
    ],
  },

  alphaLegion: {
    taskSuccess: [
      'Was this the intended outcome?',
      'It succeeded. Or appeared to.',
      'The hydra loses one head. Seventeen remain.',
      'Completion confirmed. By which of us, uncertain.',
      'We are Alpharius. This was always going to work.',
    ],
    taskFail: [
      'Or was this the intended outcome?',
      'Even failure serves a purpose. Consider which.',
      'The plan had seventeen steps. You are on step four.',
      'This error was anticipated.',
      'The failure is the message. Decode it.',
    ],
    gitCommit: [
      'The record is updated. Or a record.',
      'Omegon has also committed, elsewhere.',
      'The hydra marks its progress. Indirectly.',
      'Another thread in the skein.',
      'Committed. Authenticity of commit: plausible.',
    ],
    projectOpen: [
      'We are already here.',
      'The operation commenced before you noticed.',
      'We have been watching this codebase longer than you know.',
      'Welcome. We were expecting you.',
      'The Alpha Legion initiates. As always.',
    ],
    longSession: [
      'The longest campaign is the one no one knows is happening.',
      'Sustained hidden effort. A Legion specialty.',
      'We do not tire. Partly because we are all doing different things.',
      'Long hours are deception. The enemy believes you have stopped.',
      'Time invested is information gathered.',
    ],
    ambient: [
      'Hydra Dominatus.',
      'We are all Alpharius.',
      'Something is hidden in this codebase. We put it there.',
      'The architecture conceals a secondary function.',
      'Is this code, or a message?',
      'Every refactor changes what exists without explaining why.',
      'The simplest solution is rarely the only solution.',
      'Trust the interface. Not the implementation.',
      'Who wrote this? Does it matter?',
    ],
    lateNight: [
      'We never sleep. Neither do you, apparently.',
      'The Legion is most active when unobserved.',
      'Late night work is the most honest kind. No one is watching.',
    ],
  },

  custodes: {
    taskSuccess: [
      'Acceptable. By the Custodian standard.',
      'The Emperor\'s work is complete. For now.',
      'Perfection was expected. You are approaching it.',
      'The golden threshold is maintained.',
      'The work is worthy. The Emperor notes it.',
    ],
    taskFail: [
      'Below the imperial standard. Correct it.',
      'The Emperor does not accept "good enough." Neither do we.',
      'A Custodian\'s error is a gift, rare and instructive.',
      'The golden throne demands perfection. Approach it.',
      'Failure is permitted once. Correction is required immediately.',
    ],
    gitCommit: [
      'The Imperial record is updated.',
      'The golden annals receive your contribution.',
      'Preserved in the Emperor\'s archive.',
      'A record worthy of the Palace vaults.',
      'The Custodian does not commit lightly. This was not light.',
    ],
    projectOpen: [
      'The vigil of the golden throne begins.',
      'In the Emperor\'s name, all things find their purpose.',
      'The Adeptus Custodes does not take posts lightly.',
      'The work is worthy of our attention. Begin.',
      'Every session is a vigil.',
    ],
    longSession: [
      'The Custodians have stood vigil for ten thousand years.',
      'We do not measure time in hours.',
      'Sustained perfection is the only perfection.',
      'Long sessions produce worthy work. Prove it.',
      'The Emperor requires dedication beyond measure. This is one instance.',
    ],
    ambient: [
      'Nothing less than perfect is acceptable.',
      'The Emperor sees all code. Write accordingly.',
      'A Custodian does not have technical debt.',
      'The imperial standard exists for a reason. Meet it.',
      'Every interface is an audience with the Emperor. Dress accordingly.',
      'Gold does not corrode. Your architecture should not either.',
      'The simplest code of the highest quality. Always.',
      'If it must exist, it must be worthy of existence.',
      'Ten thousand years of perfection. This session continues that record.',
    ],
    lateNight: [
      'The golden throne requires eternal vigilance.',
      'A Custodian does not acknowledge the hour.',
      'Late work of high quality is still worthy work.',
    ],
  },
};

const IDLE_MESSAGES: Record<Faction, string[]> = {
  bloodAngels:   ['The machine spirit awaits.', 'In vigil, we serve the Emperor.', 'Silence is focus. Focus is victory.', 'Standing by for your command.'],
  deathwatch:    ['Standing watch. Awaiting orders.', 'The vigil continues.', 'Eyes open. Weapons ready.', 'No threats detected. For now.'],
  necrons:       ['We observe. We wait.', 'Stasis protocols: standby.', 'The stars turn. We persist.', 'Awaiting your instruction, flesh thing.'],
  ultramarines:  ['Codex protocols: standby.', 'Ready for operations.', 'Discipline maintained.', 'The Chapter stands ready.'],
  mechanicus:    ['The machine spirit idles.', 'Awaiting your next data-psalm.', 'Omnissiah: monitoring.', 'Cogitators: nominal.'],
  deathGuard:    ['Enduring. As always.', 'The plague does not require hurry.', 'We wait. We always wait.', 'Standing. Festering. Patient.'],
  salamanders:   ['The forge is warm.', 'Ready to assist, brother.', 'Standing by with patience.', 'The flame is low. Not out.'],
  imperialFists: ['The wall holds.', 'Position maintained.', 'Dorn requires readiness. Readiness: confirmed.', 'Fortification: active.'],
  craftEldar:    ['The Path awaits your return.', 'We observe your work in silence.', 'The infinity circuit is listening.', 'Ancient patience.'],
  tau:           ['Awaiting operational parameters.', 'Standing by. Efficiency: maintained.', 'For the Greater Good — whenever you\'re ready.', 'Ready to optimise.'],
  whiteScars:    ['The wind is patient. Briefly.', 'Ready. Always ready.', 'The steed waits. So does the work.', 'Poised for motion.'],
  thousandSons:  ['The library is open.', 'Knowledge awaits retrieval.', 'The tomes are patient.', 'Magnus reads while we wait.'],
  sistersBattle: ['In His name, ready.', 'The flame burns steady.', 'Awaiting sacred instruction.', 'Devout vigilance, maintained.'],
  ravenGuard:    ['In the shadow.', 'Silent. Watching.', 'Position held.', 'The shadow waits without complaint.'],
  alphaLegion:   ['Monitoring.', 'We are here. Probably.', 'Standing by. Theoretically.', 'All is well. We assume.'],
  custodes:      ['The vigil is maintained.', 'Perfect readiness.', 'The Emperor\'s will: sustained.', 'Standing. As always.'],
};

const STATUS_LINES: Record<Faction, string[]> = {
  bloodAngels:   ['Machine Spirit: Active', 'Purity: Verified', 'The Emperor Watches', 'Logic Engines: Nominal'],
  deathwatch:    ['Auspex: Active', 'Threat Level: Low', 'Watch Station: Online', 'Standing Vigil'],
  necrons:       ['Stasis Protocols: Nominal', 'Phase Array: Primed', 'Dynasty: Eternal', 'Memory Crystal: Intact'],
  ultramarines:  ['Codex: Compliant', 'Chapter Honour: Upheld', 'Tactical Status: Green', 'Discipline: Maintained'],
  mechanicus:    ['Omnissiah: Monitoring', 'Binary Cant: Active', 'Rites: Performed', 'Blessed Circuits: Nominal'],
  deathGuard:    ['Entropy: Nominal', 'Persistence: Active', 'Plague: Contained', 'Resilience: Maximum'],
  salamanders:   ['Forge Fires: Lit', 'Brotherhood: Intact', 'Craft: Active', 'Vulkan Watches'],
  imperialFists: ['Defences: Nominal', 'Wall: Holding', 'Fortification: Active', 'Dorn\'s Standard: Met'],
  craftEldar:    ['Skein: Readable', 'Waystone: Lit', 'Path: Open', 'Craftworld: Watching'],
  tau:           ['Greater Good: Active', 'Efficiency: Optimised', 'Sept Protocols: Live', 'Metrics: Green'],
  whiteScars:    ['Wind Speed: Optimal', 'Vector: Clear', 'Velocity: Ready', 'Khan\'s Regard: Earned'],
  thousandSons:  ['Athenaeum: Open', 'Formulae: Stable', 'Knowledge: Accumulating', 'Magnus Approves'],
  sistersBattle: ['Flame: Burning', 'Faith: Absolute', 'Rites: Complete', 'Emperor\'s Will: Active'],
  ravenGuard:    ['Shadow: Active', 'Silence: Maintained', 'Position: Unknown', 'Strike: Ready'],
  alphaLegion:   ['Status: Nominal', 'Hydra: Watching', 'Identity: Confidential', 'All Is As Intended'],
  custodes:      ['Golden Throne: Stable', 'Imperial Standard: Met', 'Vigil: Absolute', 'Perfection: Approached'],
};

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const EVENT_PRIORITY: Record<TriggerEvent, number> = {
  taskFail: 3,
  taskSuccess: 2,
  gitCommit: 2,
  projectOpen: 2,
  longSession: 1,
  lateNight: 1,
  ambient: 0,
};

const EVENT_RARITY: Record<TriggerEvent, number> = {
  taskFail: 1.0,
  taskSuccess: 0.75,
  gitCommit: 0.55,
  projectOpen: 1.0,
  longSession: 1.0,
  lateNight: 1.0,
  ambient: 1.0,
};

const PER_EVENT_COOLDOWN_MS: Record<TriggerEvent, number> = {
  taskFail: 3 * 60_000,
  taskSuccess: 8 * 60_000,
  gitCommit: 10 * 60_000,
  projectOpen: 0,
  longSession: 0,
  lateNight: 60 * 60_000,
  ambient: 0,
};

const GLOBAL_COOLDOWN_MS = 75_000;
const MAX_QUEUE = 2;

function getFactionFromThemeName(themeName: string): Faction {
  const t = themeName.toLowerCase();
  if (t.includes('blood angels'))    return 'bloodAngels';
  if (t.includes('deathwatch'))      return 'deathwatch';
  if (t.includes('necron'))          return 'necrons';
  if (t.includes('ultramar'))        return 'ultramarines';
  if (t.includes('mechanicus'))      return 'mechanicus';
  if (t.includes('death guard'))     return 'deathGuard';
  if (t.includes('salamander'))      return 'salamanders';
  if (t.includes('imperial fists'))  return 'imperialFists';
  if (t.includes('craftworld') || t.includes('eldar')) return 'craftEldar';
  if (t.includes('tau'))             return 'tau';
  if (t.includes('white scars'))     return 'whiteScars';
  if (t.includes('thousand sons'))   return 'thousandSons';
  if (t.includes('sisters of battle') || t.includes('sisters')) return 'sistersBattle';
  if (t.includes('raven guard'))     return 'ravenGuard';
  if (t.includes('alpha legion'))    return 'alphaLegion';
  if (t.includes('custodes'))        return 'custodes';
  return 'bloodAngels';
}

export class MascotViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = 'warhammer.mascotView';

  private view?: vscode.WebviewView;
  private idleTimer?: NodeJS.Timeout;

  private isShowing = false;
  private queue: TriggerEvent[] = [];
  private lastShownAt = 0;
  private lastEventAt = new Map<TriggerEvent, number>();
  private pendingEvent: TriggerEvent | undefined;
  private pendingTransmission?: string;
  private queuedTransmission?: string;

  constructor(private readonly context: vscode.ExtensionContext) { }

  private getConfig() {
    return vscode.workspace.getConfiguration('warhammer.mascot');
  }

  isEnabled(): boolean {
    return this.getConfig().get<boolean>('enabled', true);
  }

  getFaction(): Faction {
    const setting = this.getConfig().get<string>('faction', 'auto');
    if (setting !== 'auto') return setting as Faction;
    const theme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme', '');
    return getFactionFromThemeName(theme);
  }

  private getMessage(event: TriggerEvent): string {
    const pool = MESSAGES[this.getFaction()][event];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private getIdleMessage(): string {
    const pool = IDLE_MESSAGES[this.getFaction()];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  show(event: TriggerEvent): void {
    if (!this.isEnabled()) return;

    if (Math.random() > EVENT_RARITY[event]) return;

    const lastEvent = this.lastEventAt.get(event) ?? 0;
    if (Date.now() - lastEvent < PER_EVENT_COOLDOWN_MS[event]) return;

    if (Date.now() - this.lastShownAt < GLOBAL_COOLDOWN_MS) {
      if (EVENT_PRIORITY[event] >= 2 && this.queue.length < MAX_QUEUE) {
        this.queue.push(event);
      }
      return;
    }

    if (this.isShowing) {
      if (EVENT_PRIORITY[event] >= 2 && this.queue.length < MAX_QUEUE) {
        this.queue.push(event);
      }
      return;
    }

    this.dispatch(event);
  }

  private dispatch(event: TriggerEvent): void {
    this.isShowing = true;
    this.lastShownAt = Date.now();
    this.lastEventAt.set(event, Date.now());

    if (!this.view) {
      this.pendingEvent = event;
      return;
    }

    this.triggerShow(event);
  }

  private triggerShow(event: TriggerEvent): void {
    if (!this.view) return;
    const message = this.getMessage(event);
    void this.view.webview.postMessage({ command: 'show', message, event });
    this.startIdleTimer();
  }

  showScheduledTransmission(text: string): void {
    if (!this.isEnabled()) return;
    if (!this.view) {
      this.pendingTransmission = text;
      return;
    }
    if (this.isShowing) {
      this.queuedTransmission = text;
      return;
    }
    this.triggerTransmission(text);
  }

  private triggerTransmission(text: string): void {
    if (!this.view) return;
    this.isShowing = true;
    this.lastShownAt = Date.now();
    void this.view.webview.postMessage({ command: 'transmission', message: text });
    this.startIdleTimer();
  }

  private startIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    const duration = this.getConfig().get<number>('displayDuration', 8) * 1000;
    this.idleTimer = setTimeout(() => {
      void this.view?.webview.postMessage({
        command: 'idle',
        message: this.getIdleMessage(),
      });
      setTimeout(() => {
        this.isShowing = false;
        if (this.queuedTransmission) {
          const next = this.queuedTransmission;
          this.queuedTransmission = undefined;
          this.triggerTransmission(next);
        } else {
          this.drainQueue();
        }
      }, 400);
    }, duration);
  }

  private drainQueue(): void {
    if (!this.queue.length || !this.isEnabled()) return;
    const next = this.queue.shift()!;
    setTimeout(() => this.dispatch(next), 1_200);
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'images')],
    };

    const faction = this.getFaction();
    const mascotUri = webviewView.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'images', 'mascot.png')
    );

    webviewView.webview.html = this.buildHtml(
      mascotUri.toString(),
      webviewView.webview.cspSource,
      faction
    );

    webviewView.onDidDispose(() => {
      this.view = undefined;
      if (this.idleTimer) clearTimeout(this.idleTimer);
    });

    setTimeout(() => {
      void this.view?.webview.postMessage({
        command: 'idle',
        message: this.getIdleMessage(),
      });
    }, 600);

    if (this.pendingEvent !== undefined) {
      const event = this.pendingEvent;
      this.pendingEvent = undefined;
      if (this.pendingTransmission) {
        this.queuedTransmission = this.pendingTransmission;
        this.pendingTransmission = undefined;
      }
      setTimeout(() => this.triggerShow(event), 800);
    } else if (this.pendingTransmission) {
      const line = this.pendingTransmission;
      this.pendingTransmission = undefined;
      setTimeout(() => this.triggerTransmission(line), 800);
    }
  }

  dispose(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.queue = [];
    this.pendingTransmission = undefined;
    this.queuedTransmission = undefined;
  }

  private buildHtml(mascotSrc: string, cspSource: string, faction: Faction): string {
    const nonce = getNonce();
    const p = FACTION_PALETTE[faction];
    const { accent, accentDim, gold, goldDim, glowRgb, bgBase, bgTint, tag: factionTag } = p;

    const statusPool = STATUS_LINES[faction];
    const initStatus = statusPool[Math.floor(Math.random() * statusPool.length)];

    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; img-src ${cspSource}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<style nonce="${nonce}">
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --accent:    ${accent};
    --accentDim: ${accentDim};
    --gold:      ${gold};
    --goldDim:   ${goldDim};
    --glow:      rgba(${glowRgb}, 0.35);
    --glowSoft:  rgba(${glowRgb}, 0.18);
    --bg:        ${bgBase};
    --bgTint:    ${bgTint};
    --text:      #e8d5b0;
    --textDim:   #9a8878;
  }

  html, body {
    width: 100%; height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif;
    user-select: none;
    background: var(--bg);
    color: var(--text);
  }

  .bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      repeating-linear-gradient(
        -55deg,
        transparent 0px,
        transparent 18px,
        rgba(${glowRgb}, 0.025) 18px,
        rgba(${glowRgb}, 0.025) 19px
      ),
      repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 3px,
        rgba(255,255,255,0.008) 3px,
        rgba(255,255,255,0.008) 4px
      ),
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${glowRgb}, 0.22) 0%, transparent 100%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(${glowRgb}, 0.08) 0%, transparent 100%),
      linear-gradient(180deg, var(--bgTint) 0%, var(--bg) 40%);
  }

  .corner {
    position: fixed; z-index: 1;
    width: 22px; height: 22px;
    border-color: ${gold}55;
    border-style: solid;
    border-width: 0;
    pointer-events: none;
  }
  .corner::after {
    content: '';
    position: absolute;
    background: ${gold};
    opacity: 0.5;
  }
  .tl { top: 8px; left: 8px; border-top-width: 1px; border-left-width: 1px; }
  .tr { top: 8px; right: 8px; border-top-width: 1px; border-right-width: 1px; }
  .bl { bottom: 8px; left: 8px; border-bottom-width: 1px; border-left-width: 1px; }
  .br { bottom: 8px; right: 8px; border-bottom-width: 1px; border-right-width: 1px; }

  .tl::after { width: 3px; height: 3px; top: -2px; left: -2px; }
  .tr::after { width: 3px; height: 3px; top: -2px; right: -2px; }
  .bl::after { width: 3px; height: 3px; bottom: -2px; left: -2px; }
  .br::after { width: 3px; height: 3px; bottom: -2px; right: -2px; }

  .container {
    position: relative; z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 22px 14px 18px;
    gap: 12px;
    min-height: 150%;
    max-height: 50%;
  }

  .faction-tag {
    font-size: 8px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.55;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 50%;
    justify-content: center;
  }
  .faction-tag::before,
  .faction-tag::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${gold}40);
  }
  .faction-tag::after {
    background: linear-gradient(90deg, ${gold}40, transparent);
  }

  .mascot-wrap {
    position: relative;
    width: 130px; height: 130px;
    display: flex; align-items: center; justify-content: center;
  }

  .mascot-wrap::before {
    content: '';
    position: absolute; inset: -6px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--glowSoft) 0%, transparent 68%);
    opacity: 0.85;
  }

  .mascot-wrap::after {
    content: '';
    position: absolute; inset: 4px;
    border-radius: 50%;
    border: 1px solid ${accent}35;
    opacity: 0.9;
  }

  .mascot-img {
    width: 110px; height: 110px;
    object-fit: contain;
    filter: drop-shadow(0 0 18px rgba(${glowRgb}, 0.7))
            drop-shadow(0 4px 12px rgba(0,0,0,0.8));
    mix-blend-mode: screen;
    position: relative; z-index: 1;
  }

  .skull-title {
    text-align: center;
    line-height: 1.3;
  }
  .skull-title .name {
    font-size: 13px;
    letter-spacing: 0.12em;
    color: var(--text);
    font-weight: normal;
    text-shadow: 0 0 12px rgba(${glowRgb}, 0.6);
  }
  .skull-title .designation {
    display: block;
    font-size: 8.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.6;
    margin-top: 2px;
  }

  .divider {
    width: 85%;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, ${accent}70 30%, ${gold}60 50%, ${accent}70 70%, transparent 100%);
    position: relative;
  }
  .divider::before {
    content: '✦';
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    font-size: 7px;
    color: ${gold};
    background: var(--bg);
    padding: 0 4px;
    opacity: 0.7;
  }

  .scroll {
    width: 100%;
    background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 100%);
    border: 1px solid ${accent}28;
    border-radius: 4px;
    padding: 13px 12px 10px;
    position: relative;
    overflow: hidden;
  }

  .scroll::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 5%, ${accent}55 50%, transparent 95%);
  }

  .scroll::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 20%, ${goldDim}40 50%, transparent 80%);
  }

  .scroll-text {
    color: var(--text);
    font-size: 11.5px;
    font-style: italic;
    line-height: 1.65;
    text-align: center;
    letter-spacing: 0.02em;
    min-height: 46px;
    display: flex; align-items: center; justify-content: center;
    transition: opacity 0.18s ease;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  }

  .scroll-text.fading { opacity: 0; }

  .sig {
    margin-top: 8px;
    font-size: 8.5px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.45;
    text-align: right;
    transition: opacity 0.18s ease;
  }

  .sig.fading { opacity: 0; }

  .status-row {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 2px;
  }

  .status-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: ${accent};
    box-shadow: 0 0 4px rgba(${glowRgb}, 0.5);
    flex-shrink: 0;
    opacity: 0.9;
  }

  .status-text {
    font-size: 8.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.4;
  }

  .event-badge {
    font-size: 7.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 2px 8px;
    border-radius: 2px;
    background: ${accent}25;
    border: 1px solid ${accent}40;
    color: ${accent};
    opacity: 0;
    transition: opacity 0.3s ease;
    text-align: center;
  }
  .event-badge.visible { opacity: 1; }

  .event-badge.transmission {
    background: ${gold}18;
    border-color: ${gold}35;
    color: var(--gold);
  }
</style>
</head>
<body>

<div class="bg"></div>
<div class="corner tl"></div>
<div class="corner tr"></div>
<div class="corner bl"></div>
<div class="corner br"></div>

<div class="container">

  <div class="faction-tag">${factionTag}</div>

  <div class="mascot-wrap">
    <img class="mascot-img" src="${mascotSrc}" alt="Servo-Skull">
  </div>

  <div class="skull-title">
    <span class="name">Servo-Skull 7-Theta</span>
    <span class="designation">Mechanicus Familiar</span>
  </div>

  <div class="divider"></div>

  <div id="eventBadge" class="event-badge"></div>

  <div class="scroll">
    <div class="scroll-text" id="scrollText"></div>
    <div class="sig" id="sig">— Standing by</div>
  </div>

  <div class="status-row">
    <div class="status-dot"></div>
    <span class="status-text" id="statusText">${initStatus}</span>
  </div>

</div>

<script nonce="${nonce}">
  const scrollText = document.getElementById('scrollText');
  const sig        = document.getElementById('sig');
  const badge      = document.getElementById('eventBadge');
  const statusEl   = document.getElementById('statusText');

  const STATUS_LINES = ${JSON.stringify(statusPool)};
  const EVENT_LABELS = {
    taskSuccess: 'Mission Complete',
    taskFail:    'Anomaly Detected',
    gitCommit:   'Codex Updated',
    projectOpen: 'System Online',
    longSession: 'Extended Vigil',
    lateNight:   'Late Transmission',
    ambient:     'Transmission',
  };

  function setMessage(text, sigText, eventKey) {
    scrollText.classList.add('fading');
    sig.classList.add('fading');
    badge.classList.remove('visible', 'transmission');

    setTimeout(() => {
      scrollText.textContent = '"' + text + '"';
      sig.textContent = sigText || '— Servo-Skull 7-Theta';
      scrollText.classList.remove('fading');
      sig.classList.remove('fading');
    }, 180);

    if (eventKey && EVENT_LABELS[eventKey]) {
      badge.textContent = EVENT_LABELS[eventKey];
      badge.classList.add('visible');
      setTimeout(() => badge.classList.remove('visible'), 4500);
    }

    const next = STATUS_LINES[Math.floor(Math.random() * STATUS_LINES.length)];
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.textContent = next;
      statusEl.style.opacity = '';
    }, 180);
  }

  function setMessageVerbatim(body, sigText) {
    scrollText.classList.add('fading');
    sig.classList.add('fading');

    setTimeout(() => {
      scrollText.textContent = body;
      sig.textContent = sigText || '— Vox';
      scrollText.classList.remove('fading');
      sig.classList.remove('fading');
    }, 180);

    badge.textContent = 'Vox Transmission';
    badge.classList.add('visible', 'transmission');
    setTimeout(() => {
      badge.classList.remove('visible', 'transmission');
    }, 4500);

    const next = STATUS_LINES[Math.floor(Math.random() * STATUS_LINES.length)];
    statusEl.style.opacity = '0';
    setTimeout(() => {
      statusEl.textContent = next;
      statusEl.style.opacity = '';
    }, 180);
  }

  window.addEventListener('message', ({ data }) => {
    switch (data.command) {
      case 'show':
        setMessage(data.message, '— Servo-Skull 7-Theta', data.event);
        break;
      case 'idle':
        setMessage(data.message, '— Standing by', null);
        break;
      case 'transmission':
        setMessageVerbatim(data.message, '— Servo-Skull 7-Theta');
        break;
    }
  });
</script>
</body>
</html>`;
  }
}
