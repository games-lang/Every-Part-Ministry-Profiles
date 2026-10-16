import assert from "node:assert/strict";
import test from "node:test";
import {
  CHURCH_TRADITIONS,
  MINISTRY_CUSTOMIZATION_MODES,
  defaultMinistryCustomization,
  excludedSpiritualGifts,
  ministryCustomization,
  recommendedMinistryLabels,
  recommendedSpiritualGifts,
} from "./ministry-customization.ts";
import { SUPPORTED_SPIRITUAL_GIFT_NAMES } from "./spiritual-gifts.ts";

const exclusions = ["Tongues", "Interpretation of Tongues"];
const excludingTraditions = new Set(["nazarene", "baptist", "presbyterianReformed", "lutheran"]);

test("tradition gift starting points exclude only tongues and interpretation in the four specified traditions", () => {
  for (const tradition of CHURCH_TRADITIONS) {
    const expected = excludingTraditions.has(tradition) ? exclusions : [];
    assert.deepEqual(excludedSpiritualGifts(tradition), expected, tradition);
    assert.deepEqual(
      recommendedSpiritualGifts(tradition, SUPPORTED_SPIRITUAL_GIFT_NAMES),
      SUPPORTED_SPIRITUAL_GIFT_NAMES.filter(gift => !expected.includes(gift)),
      tradition,
    );
  }
});

test("client and server recommendations and labels agree for every tradition", async () => {
  const client = await import(new URL("../../../every-part/src/lib/ministry-customization.ts", import.meta.url).href);
  for (const tradition of CHURCH_TRADITIONS) {
    assert.deepEqual(client.excludedSpiritualGifts(tradition), excludedSpiritualGifts(tradition), tradition);
    assert.deepEqual(
      client.recommendedSpiritualGifts(tradition, SUPPORTED_SPIRITUAL_GIFT_NAMES),
      recommendedSpiritualGifts(tradition, SUPPORTED_SPIRITUAL_GIFT_NAMES),
      tradition,
    );
    assert.deepEqual(client.recommendedMinistryLabels(tradition), recommendedMinistryLabels(tradition), tradition);
  }
});

test("label resolution remains standard, tradition-recommended or church-typed in every mode", () => {
  const distinctLabels = {
    catholic: ["Charisms & Gifts for Service", "Parish Ministries"],
    easternOrthodox: ["Gifts for Service", "Parish Ministries"],
    anglicanEpiscopal: ["Gifts for Ministry", "Ministry Opportunities"],
  };
  for (const tradition of CHURCH_TRADITIONS) {
    const expectedRecommended = distinctLabels[tradition as keyof typeof distinctLabels]
      ?? ["Spiritual Gifts", "Ministry Interests"];
    assert.deepEqual(Object.values(recommendedMinistryLabels(tradition)), expectedRecommended);
    for (const mode of MINISTRY_CUSTOMIZATION_MODES) {
      const resolved = ministryCustomization({
        ...defaultMinistryCustomization(), tradition, mode,
        customTradition: tradition === "other" ? "Our tradition" : null,
        spiritualGiftsLabel: "Our gifts", ministryInterestsLabel: "Our serving places",
      });
      assert.ok(resolved);
      assert.deepEqual(
        [resolved.spiritualGiftsLabel, resolved.ministryInterestsLabel],
        mode === "custom" ? ["Our gifts", "Our serving places"]
          : mode === "tradition" ? expectedRecommended : ["Spiritual Gifts", "Ministry Interests"],
        `${tradition}/${mode}`,
      );
    }
  }
});
