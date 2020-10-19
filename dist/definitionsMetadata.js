var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
export default [
    { name: "DestinyInventoryItemDefinition" },
    { name: "DestinyInventoryBucketDefinition" },
    { name: "DestinySandboxPerkDefinition" },
    { name: "DestinyDamageTypeDefinition" },
    { name: "DestinyItemTierTypeDefinition" },
    { name: "DestinyPowerCapDefinition" },
    { name: "DestinyBreakerTypeDefinition" },
    { name: "DestinyEnergyTypeDefinition" },
    { name: "DestinyItemCategoryDefinition" },
    { name: "DestinyEquipmentSlotDefinition" },
    { name: "DestinyPresentationNodeDefinition" },
    { name: "DestinyRecordDefinition" },
    { name: "DestinyCollectibleDefinition" },
    { name: "DestinyObjectiveDefinition" },
    { name: "DestinyChecklistDefinition" },
    { name: "DestinyVendorDefinition" },
    { name: "DestinyVendorGroupDefinition" },
    { name: "DestinyProgressionDefinition" },
    { name: "DestinyProgressionLevelRequirementDefinition" },
    { name: "DestinyMilestoneDefinition" },
    { name: "DestinyActivityDefinition" },
    { name: "DestinyActivityModeDefinition" },
    { name: "DestinyActivityTypeDefinition" },
    { name: "DestinyActivityModifierDefinition" },
    { name: "DestinyLoreDefinition" },
    { name: "DestinyPlaceDefinition" },
    { name: "DestinyLocationDefinition" },
    { name: "DestinyDestinationDefinition" },
    { name: "DestinySeasonDefinition" },
    { name: "DestinySeasonPassDefinition" },
    { name: "DestinyArtifactDefinition" },
    { name: "DestinyClassDefinition" },
    { name: "DestinyGenderDefinition" },
    { name: "DestinyRaceDefinition" },
    { name: "DestinyEnemyRaceDefinition" },
    { name: "DestinyFactionDefinition" },
    { name: "DestinyTraitDefinition" },
    { name: "DestinyTraitCategoryDefinition" },
    { name: "DestinyMetricDefinition" },
    { name: "DestinySocketCategoryDefinition" },
    { name: "DestinySocketTypeDefinition" },
    { name: "DestinyAchievementDefinition" },
    { name: "DestinyTalentGridDefinition" },
    { name: "DestinyStatDefinition" },
    { name: "DestinyStatGroupDefinition" },
    { name: "DestinyMedalTierDefinition" },
    { name: "DestinyActivityGraphDefinition" },
    { name: "DestinyBondDefinition" },
    { name: "DestinyReportReasonCategoryDefinition" },
    { name: "DestinyPlugSetDefinition" },
    { name: "DestinyRewardItemListDefinition", junk: true },
    { name: "DestinySackRewardItemListDefinition", junk: true },
    { name: "DestinySandboxPatternDefinition", junk: true },
    { name: "DestinyUnlockDefinition", junk: true },
    { name: "DestinyMaterialRequirementSetDefinition", junk: true },
    { name: "DestinyNodeStepSummaryDefinition", junk: true },
    { name: "DestinyArtDyeChannelDefinition", junk: true },
    { name: "DestinyArtDyeReferenceDefinition", junk: true },
    { name: "DestinyProgressionMappingDefinition", junk: true },
    { name: "DestinyRewardSourceDefinition", junk: true },
    { name: "DestinyUnlockValueDefinition", junk: true },
    { name: "DestinyRewardMappingDefinition", junk: true },
    { name: "DestinyRewardSheetDefinition", junk: true },
    { name: "DestinyActivityInteractableDefinition", junk: true },
    { name: "DestinyEntitlementOfferDefinition", junk: true },
    { name: "DestinyPlatformBucketMappingDefinition", junk: true },
    { name: "DestinyPresentationNodeBaseDefinition", junk: true },
    { name: "DestinyCharacterCustomizationCategoryDefinition", junk: true },
    { name: "DestinyCharacterCustomizationOptionDefinition", junk: true },
    { name: "DestinyRewardAdjusterProgressionMapDefinition", junk: true },
    { name: "DestinyUnlockCountMappingDefinition", junk: true },
    { name: "DestinyUnlockEventDefinition", junk: true },
    { name: "DestinyUnlockExpressionMappingDefinition", junk: true },
    { name: "DestinyRewardAdjusterPointerDefinition", junk: true },
    { name: "DestinyInventoryItemLiteDefinition", junk: true },
].reduce(function (acc, item, index) {
    var _a;
    return __assign(__assign({}, acc), (_a = {}, _a[item.name] = __assign(__assign({}, item), { index: index }), _a));
}, {});