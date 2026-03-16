# Client Progress Update: Door Builder Enhancements & Fixes

"Hi there! I wanted to give you a quick walkthrough of the latest updates we've made to the Custom Door Designer. We've focused on refining the hinge and rail logic to ensure a perfect balance between manufacturing accuracy and design flexibility. Here’s what’s new:"

### 1. Refined Hinge & Rail Logic
"First up, we've updated the spatial rules for angled doors. While **Mid-Rails** now have full freedom to distribute across the entire panel height—including the angled zone—we've kept **Hinges** strictly on the straight vertical edges. This ensures the hinges always have solid material to bite into, preventing any manufacturing errors."

### 2. Intelligent "Top" References
"For these angled doors, we’ve restored the **Top Hinge Reference** to sit at the 'shoulder'—the highest vertical point of the door. This means when you set a hinge to '100mm from Top,' it’s calculated from that shoulder point, ensuring it consistently lands on the vertical stile where it belongs."

### 3. Improved Equalization
"We’ve also squashed a bug in the **Equalise Spacing** tool. Previously, triggering equalization on angled doors could sometimes displace hinges outside the door area. We've corrected the coordinate mapping so that equalization now perfectly spaces your hinges within the available vertical area, respecting those same shoulder-relative anchors."

### 4. Continuous Design & Rendering
"On the visual side, we’ve fixed the 'triangular panel' bug. The panel now renders a perfect triangle even when the cutouts match the door dimensions. We’ve also eliminated the horizontal 'step' gap at the angled corners, so the panel outline is now one smooth, continuous line."

### 5. Persistent Preferences
"Finally, we've made the **Hinge Swap** button smarter. It now persists your side preference (Left or Right) even if the hinge list is empty. Any new hinges you add will automatically appear on your last chosen side."

### 6. Expanded Angle Range
"As a bonus, we've removed the strict 15-to-60 degree limit on angles. You can now design corners ranging from a very shallow 1 degree all the way up to a steep 89 degrees, giving you total creative control."

---

"These updates make the builder much more robust and aligned with actual production requirements. Take a look and let us know what you think!"
