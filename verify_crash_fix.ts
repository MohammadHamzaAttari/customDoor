
import { enforceDoorRules, type DoorOrderItem } from "./client/src/lib/stores/useDoorStore";

console.log("Starting verification of crash fix...");

// Create a mock door object with MISSING arrays (simulating the crash condition)
const badDoor = {
    id: "crash_test",
    width: 500,
    height: 720,
    thickness: 22,
    panelType: "SHAKER",
    // hinges and midRails are UNDEFINED here
} as unknown as DoorOrderItem;

try {
    console.log("Testing enforceDoorRules with missing arrays...");
    const result = enforceDoorRules(badDoor);

    console.log("Success! Function returned without crashing.");
    console.log("Hinges array exists?", Array.isArray(result.hinges));
    console.log("MidRails array exists?", Array.isArray(result.midRails));

    if (Array.isArray(result.hinges) && Array.isArray(result.midRails)) {
        console.log("VERIFICATION PASSED: Arrays were automatically initialized.");
    } else {
        console.error("VERIFICATION FAILED: Arrays were not initialized.");
        process.exit(1);
    }

} catch (error) {
    console.error("CRASH DETECTED!", error);
    process.exit(1);
}
