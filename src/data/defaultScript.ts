export interface SceneScript {
  id: string;
  actNumber: number;
  title: string;
  mood: string;
  stylePrompt: string;
  text: string;
  estimatedDurationSec: number;
}

export const DEFAULT_EPISODE_TITLE = "ZOMBIE APOCALYPSE — EPISODE 1: The Beginning of the End";

export const DEFAULT_SCENES: SceneScript[] = [
  {
    id: "scene-1",
    actNumber: 1,
    title: "Part 1: The Whispering Forest",
    mood: "Calm & Mysterious",
    stylePrompt: "Speak in a calm, deep, mysterious tone. Describe the pristine quiet of the ancient forest and morning mist. Use gentle, slow pacing with quiet awe.",
    text: "Long before the screams tore through the valley, there was only the forest. Dense, unbroken, and centuries old. In the early morning hours, a cold mountain mist clung to the canopy, swallowing every whisper of wind. To any wanderer, it appeared untouched—a sanctuary of stillness. But deep beneath the quiet moss, nature had begun to corrupt itself.",
    estimatedDurationSec: 28,
  },
  {
    id: "scene-2",
    actNumber: 2,
    title: "Part 2: The Blackened Flora and the Goat",
    mood: "Gradual Tension & Unease",
    stylePrompt: "Gradually build tension. Voice should deepen with subtle anxiety and calculated suspense as the strange poisonous flora and the dying creature are described.",
    text: "Near the jagged ridgeline, the vegetation had turned a sickly, bruised black. Thick veins pulsed faintly along the undersides of the leaves, weeping a bitter, oily sap into the soil. A wild mountain goat, driven by thirst, grazed at the poisoned undergrowth. Within moments, its breathing hitched. Its eyes clouded into a dull, milky gray, shivering violently as dark fluids leaked from its nostrils. It collapsed into the brush, motionless... only for its ribcage to violently heave once more.",
    estimatedDurationSec: 36,
  },
  {
    id: "scene-3",
    actNumber: 3,
    title: "Part 3: The Contaminated Meat & The 5-Minute Turn",
    mood: "Dark, Chilling & Intense",
    stylePrompt: "Deliver with dark intensity and dread. Emphasize the five-minute countdown with chilling weight. Serious, unflinching documentary horror tone.",
    text: "That evening, the carcass was carried down into the frontier settlement by hunters who knew no better. Fresh game was scarce, and hunger does not ask questions. The meat was carved and served. Then, the horror began. Exactly five minutes. That was all it took. First came the violent seizures, then the suffocating fever. The victims clawed at their own throats as black veins spider-webbed across their skin. Their jaws locked in agony. And when their hearts finally stopped, they did not stay dead. They rose with an unholy hunger.",
    estimatedDurationSec: 42,
  },
  {
    id: "scene-4",
    actNumber: 4,
    title: "Part 4: Homecoming into the Uncanny",
    mood: "Quiet Dread & Foreboding",
    stylePrompt: "Slow down delivery. Speak with profound uneasiness, hushed mystery, and heavy suspense as the protagonist steps onto the porch of their empty home.",
    text: "When I finally returned to the outskirts of town at twilight, an unnatural silence hung in the air. No dogs barked. No chimney smoke drifted against the purple sky. The front door of my family home stood slightly ajar, swinging on rusted hinges with a slow, agonizing creak. Inside, dinner was still warm on the wooden table. The kettle was steaming. But my family was gone. And on the floor of the back hallway... a steady, rhythmic drip of dark blood.",
    estimatedDurationSec: 38,
  },
  {
    id: "scene-5",
    actNumber: 5,
    title: "Part 5: Morning Panic & The Zombie Chase",
    mood: "Urgent, Terrifying & Relentless",
    stylePrompt: "Fast-paced tension, breathlessness, urgent and heart-pounding terror. The narrator's voice should be intense and gripping, recounting a desperate sprint for survival.",
    text: "Dawn brought no salvation—only the madness. The fog burned off to reveal streets consumed in chaos. Blood curdling shrieks echoed from every doorway. They weren't shambling corpses; they were rabid, feral creatures sprinting with unnatural speed, their jaws snapping like starving beasts. I broke into a dead run down the main road. The asphalt tore beneath my boots as three of them surged from an alleyway, snarling and clawing at my back. I could feel their ragged breath against my neck, their relentless footsteps closing the distance with every stride.",
    estimatedDurationSec: 40,
  },
  {
    id: "scene-6",
    actNumber: 6,
    title: "Part 6: The Cliffhanger & Final Breath",
    mood: "High Suspense & Dramatic Pause",
    stylePrompt: "Deep suspense, ominous cinematic trailer delivery. Deliver the final lines with deliberate gravitas, holding a long dramatic pause right before saying 'To be continued.'",
    text: "With my lungs on fire, I hurled myself inside the iron hatch of the old radio tower and slammed the rusted deadbolt shut. A split second later, three bodies crashed against the metal with bone-shattering force. Outside, dozens more joined in, scratching, howling, tearing at the iron seams. My ammunition is gone. The radio is dead. And the steel door is beginning to bend. ... ... ... To be continued.",
    estimatedDurationSec: 32,
  },
];

export interface VoiceOption {
  id: string;
  name: string;
  role: string;
  pitch: string;
  description: string;
  sampleAudio?: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "Fenrir",
    name: "Fenrir (Recommended)",
    role: "Alpha Survivalist / Dark Cinematic",
    pitch: "Low Bass & Textured Grit",
    description: "Deep, gravelly tone with high emotional gravitas. Perfect for apocalyptic trailer narration, urgent action, and tense survival chronicles.",
  },
  {
    id: "Charon",
    name: "Charon",
    role: "Documentary Narrator / Sub-Bass",
    pitch: "Ultra Deep & Resonant",
    description: "Rich, mature, authoritative voice. Evokes prestige apocalyptic documentaries and heavy narrative exposition with pristine diction.",
  },
  {
    id: "Puck",
    name: "Puck",
    role: "Weathered Veteran",
    pitch: "Mid-Low Gravel & Expressive",
    description: "Warm, grounded, slightly weathered timbre with agile dramatic pacing. Excellent for character-driven first-person horror.",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    role: "Shadow & Cold Suspense",
    pitch: "Whispering Low & Hypnotic",
    description: "Chilling, restrained, and atmospheric delivery. Maximizes psychological dread, eerie silences, and unsettling tension.",
  },
];
