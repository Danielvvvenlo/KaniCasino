const User = require("../models/User");
const Item = require("../models/Item");

// not necessarelly the same as the used in cases
const baseChances = {
    "1": { "1": 0.5, "2": 0.2, "3": 0.1, "4": 0.05, "5": 0.002 },
    "2": { "1": 0.2, "2": 0.5, "3": 0.2, "4": 0.1, "5": 0.01 },
    "3": { "1": 0.1, "2": 0.2, "3": 0.5, "4": 0.2, "5": 0.05 },
    "4": { "1": 0.05, "2": 0.1, "3": 0.2, "4": 0.5, "5": 0.1 },
    "5": { "1": 0.002, "2": 0.01, "3": 0.05, "4": 0.1, "5": 0.5 }
};

const calculateSuccessRate = (selectedItems, targetRarity) => {
    let totalChance = 0;

    for (let item of selectedItems) {
        const baseChance = baseChances[item.rarity][targetRarity];
        totalChance += baseChance;
    }

    // Apply diminishing returns
    totalChance = 1 - Math.pow(1 - totalChance, 1.25);

    // Cap the chance at 80%
    return Math.min(totalChance, 0.8);
};

// Helper function to validate if all items belong to the same case
const allItemsFromSameCase = (items) => {
    const caseId = items[0].case;
    return items.every((item) => item.case.toString() === caseId.toString());
};

const upgradeItems = async (userId, selectedItemIds, targetItemId) => {
    try {
        // Fetch the user
        const user = await User.findById(userId);
        if (!user) {
            return { status: 404, message: "User not found" };
        }

        // Fetch the selected items and target item
        const selectedItems = user.inventory.filter((invItem) =>
            selectedItemIds.includes(invItem.uniqueId)
        );
        const targetItem = await Item.findById(targetItemId);

        // Validation checks
        if (!targetItem) {
            return { status: 400, message: "No target item selected" };
        }

        if (selectedItems.length === 0) {
            return { status: 400, message: "No items selected" };
        }

        if (!allItemsFromSameCase([...selectedItems, targetItem])) {
            return { status: 400, message: "All items must be from the same case" };
        }

        // Remove the selected items from the user's inventory
        user.inventory = user.inventory.filter(
            (invItem) => !selectedItemIds.includes(invItem.uniqueId)
        );

        // Calculate the success rate and attempt the upgrade
        const successRate = calculateSuccessRate(selectedItems, targetItem);
        const isSuccess = Math.random() < successRate;

        if (isSuccess) {
            // Add the target item to the user's inventory
            user.inventory.unshift({
                _id: targetItem._id,
                name: targetItem.name,
                image: targetItem.image,
                rarity: targetItem.rarity,
                case: targetItem.case,
                uniqueId: require('uuid').v4(),
            });
        }

        await user.save();

        return { status: 200, success: isSuccess, item: isSuccess ? targetItem : null };
    } catch (error) {
        console.error(error);
        return { status: 500, message: "Internal server error" };
    }
};

module.exports = upgradeItems;
