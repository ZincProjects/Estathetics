import type { RoomScan } from "@/lib/schemas/room-scan";

/** Realistic mock scans used when ANTHROPIC_API_KEY is not set. Keyed loosely by room type. */
const LIVING: RoomScan = {
  room_type: "Living room",
  summary:
    "A rectangular HDB living room with a full-width window on the far wall and a main door on the left. Finishes are dated but sound, and the layout has a clear wall for a TV feature and space for a dining nook.",
  dimensions: {
    length_m: 5.6,
    width_m: 3.4,
    area_sqm: 19,
    ceiling_height_m: 2.6,
    confidence: "medium",
    basis: "The interior door (about 2.1m high) and the 600×600mm floor tiles visible in the foreground.",
  },
  natural_light: {
    direction: "Far wall, facing the camera, through a wide two-panel window",
    level: "bright",
    notes: "Strong daylight in the afternoon is likely. Consider sheer curtains and a light-diffusing blind.",
  },
  windows: [{ location: "Far wall, centred", type: "Sliding, two panels", approx_width_m: 2.4, notes: "Grille fitted. No bay ledge." }],
  doors: [{ location: "Left wall, near the camera", type: "Solid timber swing door", notes: "Swings inward. Keep about 0.9m clear." }],
  flooring: { material: "Homogeneous tiles, 600×600mm, beige", condition: "Good, slightly dated" },
  walls: { material: "Plastered and painted", colour: "Off-white", condition: "Minor scuffs near the floor" },
  ceiling: { type: "Flat with a perimeter beam on the window side", notes: "No false ceiling" },
  existing_furniture: [
    { item: "Three-seater fabric sofa", recommendation: "replace", notes: "Worn and oversized for the wall" },
    { item: "Low timber coffee table", recommendation: "keep", notes: "Good proportions. Could be refinished." },
    { item: "Floor lamp", recommendation: "rework", notes: "Swap the shade for warmer light" },
  ],
  fixtures: ["Ceiling light point (centre)", "Wall-mounted aircon fan coil", "Switch panel beside the door", "Power points either side of the TV wall"],
  constraints: [
    {
      type: "beam",
      description: "A structural beam runs along the window wall about 0.4m below the ceiling.",
      location: "Window side, full width",
      design_impact: "Curtain tracks need a pelmet, or a bulkhead that hides the beam.",
    },
    {
      type: "aircon_trunking",
      description: "Exposed aircon trunking runs from the fan coil to the corner.",
      location: "Top of the right wall",
      design_impact: "Box it in with an L-box or carpentry.",
    },
    {
      type: "db_box",
      description: "DB box beside the main door.",
      location: "Left wall, about 1.8m high",
      design_impact: "Keep it accessible. A hinged shoe-cabinet panel can conceal it.",
    },
  ],
  opportunities: [
    "Build full-height storage along the right wall to hide the trunking and add shoe storage near the door.",
    "Make the TV wall a fluted-panel feature with concealed cabling.",
    "Use the corner by the window for a reading nook or a compact study desk.",
    "Add a cove-lit bulkhead along the beam to soften it and hold the curtain track.",
  ],
  photo_quality: { usable: true, issues: ["Slight wide-angle distortion at the edges"] },
};

const BEDROOM: RoomScan = {
  ...LIVING,
  room_type: "Bedroom",
  summary:
    "A compact bedroom with one window opposite the bed wall and a built-in wardrobe recess. It suits a queen bed with bedside tables, with care taken over door clearance.",
  dimensions: { length_m: 3.6, width_m: 3.0, area_sqm: 10.8, ceiling_height_m: 2.6, confidence: "medium", basis: "Door height and the bed size." },
  existing_furniture: [{ item: "Queen bed frame", recommendation: "keep", notes: "Upholstered headboard is in good condition" }],
  opportunities: ["Fit a wall-to-wall wardrobe with sliding doors to save swing space.", "Add bedside pendant lights to free up the bedside tables."],
};

const KITCHEN: RoomScan = {
  ...LIVING,
  room_type: "Kitchen",
  summary: "A galley-style kitchen with a window at the end. The existing cabinets run along one side, with a service yard door beyond.",
  dimensions: { length_m: 4.2, width_m: 2.2, area_sqm: 9.2, ceiling_height_m: 2.6, confidence: "low", basis: "Cabinet heights (0.9m counter); the room is only partly visible." },
  constraints: [
    { type: "pipe", description: "Gas pipe runs along the back wall.", location: "Back wall above the counter", design_impact: "Plan the upper cabinets around it, and keep the meter accessible." },
  ],
  opportunities: ["Extend the counter into an L-shape at the window end.", "Add under-cabinet LED strips for task lighting."],
};

export function mockRoomScan(roomType?: string | null): RoomScan {
  if (roomType?.includes("bed")) return BEDROOM;
  if (roomType === "kitchen") return KITCHEN;
  return LIVING;
}
