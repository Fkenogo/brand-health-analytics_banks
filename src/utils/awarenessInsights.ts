import type { AwarenessMetricKey } from '@/config/awarenessInsights';
import type { AwarenessReportPayload } from '@/services/aiStrategyAdvisorService';

export interface AwarenessMetricInsightArgs {
  key: AwarenessMetricKey;
  value: number | null;
  compareValue?: number | null;
  compareBankName?: string | null;
  sampleSize?: number;
}

export interface FunnelInsightArgs {
  aware: number | null;
  spontaneous: number | null;
  topOfMind: number | null;
  aided: number | null;
}

export interface RankRow {
  bankId: string;
  bankName: string;
  awareness: number;
  topOfMind: number;
  rank: number;
  movement?: number | null;
}

export interface RankingInsightArgs {
  rows: RankRow[];
  selectedBankId: string;
  sampleSize: number;
}

export interface IntentInsightArgs {
  averageIntent: number;
  highIntentPct: number;
  highIntentNonUserPct: number;
  lowIntentCurrentUserCount: number;
  responseBase: number;
}

export interface AwarenessInsightResult {
  snapshot: string; // 1-sentence card footer — interpretive, not metric restatement
  detail: string;   // consulting-grade sections separated by \n\n, each prefixed HEADING:
}

const LOW_SAMPLE = 30;

function s(...parts: string[]): string {
  return parts.join('\n\n');
}

function cmpSection(value: number, compareValue: number | null | undefined, compareBankName: string | null | undefined): string {
  if (compareValue == null || !isFinite(compareValue) || !compareBankName) return '';
  const diff = value - compareValue;
  const absD = Math.abs(diff).toFixed(1);
  const dir = Math.abs(diff) < 0.5 ? 'level with' : diff > 0 ? `${absD}pp ahead of` : `${absD}pp behind`;
  const significance = Math.abs(diff) > 10
    ? 'a material strategic gap'
    : Math.abs(diff) > 5
    ? 'a meaningful operational difference'
    : 'a narrow gap that could shift within a single campaign cycle';
  const follow = diff < 0
    ? `Closing this gap should be a defined campaign objective with a quarterly milestone and a timeline commitment.`
    : `Sustaining this lead requires continued distinctiveness investment — gaps close faster than they open once a challenger commits to parity spending.`;
  return `\n\nCOMPETITOR CONTEXT: At ${compareValue.toFixed(1)}%, ${compareBankName} sits ${dir} this brand — ${significance}. ${follow}`;
}

function smplSection(sampleSize: number | undefined): string {
  if (sampleSize === undefined || sampleSize >= LOW_SAMPLE) return '';
  return `\n\nSAMPLE CAUTION: With ${sampleSize} respondents in this slice, percentages carry wide confidence intervals — individual metric swings of 5-10pp fall within the margin of error. Use these figures as directional signals, not precise targets, until sample reaches 30+.`;
}

// ─── Metric-level insight builder ────────────────────────────────────────────

export function buildAwarenessMetricInsight(args: AwarenessMetricInsightArgs): AwarenessInsightResult | null {
  const { key, value, compareValue, compareBankName, sampleSize } = args;
  if (value === null || !isFinite(value)) return null;

  const cmp = cmpSection(value, compareValue, compareBankName);
  const smpl = smplSection(sampleSize);

  switch (key) {
    case 'top_of_mind': {
      const tier = value >= 30 ? 'leader' : value >= 20 ? 'strong' : value >= 10 ? 'moderate' : value >= 5 ? 'weak' : 'minimal';

      const snapshot =
        tier === 'leader' ? 'Market leader in first-recall — this brand anchors the category and its instinctive consideration advantage compounds over time.'
        : tier === 'strong' ? 'Strong top-of-mind approaching leadership — roughly 1 in 5 respondents name this brand first, creating a meaningful organic preference advantage.'
        : tier === 'moderate' ? 'Moderate top-of-mind — the brand enters unaided consideration sets but does not yet dominate the first-recall moments that drive organic choice.'
        : tier === 'weak' ? 'Weak top-of-mind — competitors hold the first-recall advantage and the brand rarely surfaces as the first choice in unaided recall.'
        : 'Minimal unaided presence — the brand is essentially absent from first-recall consideration sets and relies entirely on prompted recognition to enter decisions.';

      const market =
        tier === 'leader' ? `MARKET INTERPRETATION: At ${value.toFixed(1)}%, this brand commands first-recall dominance. Research consistently shows the first-recalled brand in a category captures a disproportionate share of consideration, trial, and repeat loyalty — typically 3-5× the conversion rate of brands recalled second or later. This position is the most defensible form of brand equity.`
        : tier === 'strong' ? `MARKET INTERPRETATION: At ${value.toFixed(1)}%, the brand holds a strong salience position approaching leadership. Brands sustaining 20%+ top-of-mind begin to benefit from organic recall compounding — a flywheel where existing salience attracts new first-time recall without proportional media investment.`
        : tier === 'moderate' ? `MARKET INTERPRETATION: At ${value.toFixed(1)}%, the brand occupies the competitive middle band — present in the awareness landscape but not anchoring category decisions. In most banking markets, the top two brands capture the majority of first-recall moments. At current levels, the brand is a valid option but not the instinctive default.`
        : `MARKET INTERPRETATION: At ${value.toFixed(1)}%, the brand is in a structurally vulnerable recall position — winning only a small fraction of first-mention moments, easily displaced when a competitor increases media frequency or launches a distinctive campaign.`;

      const competitive =
        tier === 'leader' ? `COMPETITIVE MEANING: First-recall leadership means the brand is the default choice when consumers face a decision without deliberation. This translates into lower cost-per-acquisition, higher word-of-mouth amplification, and resilience during media-dark periods — structural benefits that compound and become progressively harder for challengers to reverse.`
        : tier === 'strong' ? `COMPETITIVE MEANING: At this level the brand wins roughly 1 in 5 first-mention moments — meaningful but not dominant. The gap to leadership is within strategic reach: 2-3 focused distinctiveness-led campaign cycles could close it. Without continued momentum, this position is contestable by a challenger brand that increases investment.`
        : tier === 'moderate' ? `COMPETITIVE MEANING: A ${value.toFixed(1)}% position means the brand wins approximately 1 in 8 first-mention moments. Competitors holding 20%+ have a structural recall advantage — consumers default to them without deliberation. Breaking into that group requires disrupting established mental structures, not simply increasing media reach.`
        : `COMPETITIVE MEANING: At this salience level the brand is not winning first-mention moments in any significant segment. It is effectively a "known option" that only enters consideration when consumers are actively comparing, not instinctively at the moment of decision — a fundamentally weaker commercial position.`;

      const consumer =
        tier === 'leader' || tier === 'strong'
        ? `CONSUMER SIGNAL: Consumers who name this brand first are demonstrating habitual salience — it has been encoded as a primary category cue. This level of mental availability predicts consistent usage rates, lower churn susceptibility, and reduced sensitivity to competitor promotional offers — the hallmarks of deep brand preference.`
        : tier === 'moderate'
        ? `CONSUMER SIGNAL: For every consumer who recalls this brand first, 7-8 others recall a competitor — and those consumers default to their top-of-mind brand. This represents a cohort of latent sympathisers: aware, potentially interested, but not yet holding this brand as their primary category anchor. They are winnable at relatively low cost with the right distinctiveness investment.`
        : `CONSUMER SIGNAL: Most aware consumers treat this brand as a secondary or backup option. It surfaces in consideration only when prompted or during active comparison — not instinctively. This "recognition-without-activation" pattern is common in brands that have invested in reach without investing in distinctiveness.`;

      const risk =
        tier === 'leader' ? `RISK & OPPORTUNITY: Risk — top-of-mind leadership erodes faster than it is built; complacency during the defence phase allows challengers to close the gap quickly. Opportunity — leverage the recall advantage to command premium positioning and reduce dependence on promotional mechanics that erode brand value long-term.`
        : tier === 'strong' ? `RISK & OPPORTUNITY: Risk — without continued investment, this position can slip to moderate within 1-2 competitor campaign cycles. Opportunity — at ${value.toFixed(1)}%, the brand is close to the threshold where organic recall compounds; the next 5-8pp gain is the highest-value investment in the current planning cycle.`
        : tier === 'moderate' ? `RISK & OPPORTUNITY: Risk — a sustained competitor campaign over 2-3 months can absorb the marginal first-recall consumers currently split between brands at this tier. Opportunity — moving to 20%+ is achievable within 12-18 months with focused distinctiveness investment; above that threshold organic compounding begins.`
        : `RISK & OPPORTUNITY: Risk — without active distinctiveness investment, further first-recall erosion is likely as competitors capture available first-mention share. Opportunity — the aware base already exists; converting even a small share of passive recognisers to spontaneous recall would produce measurable top-of-mind gains quickly.`;

      const strategic =
        tier === 'leader' ? `STRATEGIC IMPLICATION: The priority shifts from growing top-of-mind to defending and deepening it. Awareness quality (top-of-mind ÷ total awareness) and spontaneous recall breadth are the next focus metrics — ensuring first-recall leadership translates into full-funnel advantage rather than headline share alone.`
        : tier === 'strong' ? `STRATEGIC IMPLICATION: The growth agenda should focus narrowly on crossing the 25-30% leadership threshold. This is more valuable than broad awareness growth — the compounding effects above 25% create significantly better ROI on media investment and build defensible brand equity.`
        : tier === 'moderate' ? `STRATEGIC IMPLICATION: The brand faces a middle-tier trap — awareness investment generates reach without building durable salience. Continued broad reach investment without improving brand distinctiveness will grow aided recognition while leaving top-of-mind largely unchanged. The next planning cycle must make distinctiveness, not reach, the primary investment thesis.`
        : `STRATEGIC IMPLICATION: Building brand memory structures is the prerequisite for all other metric improvement. Salience cannot be purchased through reach alone — it requires consistent, distinctive, and emotionally resonant creative that encodes specific brand triggers in consumer memory.`;

      const action =
        tier === 'leader' ? `RECOMMENDED ACTION: Protect share of voice above the current top-of-mind percentage. Monitor awareness quality quarterly for signs of passive decay. Invest in brand asset consistency — visual, sonic, and associative cues must remain stable and distinctive to maintain first-recall encoding.`
        : tier === 'strong' ? `RECOMMENDED ACTION: Identify the consumer segment where top-of-mind is most contestable from the current leader and build a focused campaign to win it. Run 2-3 consecutive brand distinctiveness-led cycles with increased frequency. Set the 25% threshold as a specific media and creative objective with a defined timeline.`
        : tier === 'moderate' ? `RECOMMENDED ACTION: Audit which memory triggers — visual identity, sonic cues, character, tagline — most reliably generate first-recall in this category. Concentrate creative investment on those triggers for 2-3 consecutive campaign cycles. Prioritise depth and frequency of impression over breadth of reach.`
        : `RECOMMENDED ACTION: Begin with a brand distinctiveness sprint: identify the single trigger with the highest potential for encoding first-recall, and build a focused 6-month campaign around it before expanding to broader awareness investment.`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + cmp + smpl };
    }

    case 'spontaneous_recall': {
      const tier = value >= 60 ? 'excellent' : value >= 40 ? 'good' : value >= 20 ? 'moderate' : 'weak';

      const snapshot =
        tier === 'excellent' ? 'Exceptional spontaneous recall — the majority of the market holds this brand in active memory without any prompt.'
        : tier === 'good' ? 'Strong spontaneous recall — a large share of the market actively remembers this brand without needing a prompt.'
        : tier === 'moderate' ? 'Moderate unprompted recall — the brand is present but not prominent in unaided memory, with most recognition still requiring a prompt.'
        : 'Weak spontaneous recall — the brand depends heavily on prompted recognition and rarely activates in unaided decision contexts.';

      const market = `MARKET INTERPRETATION: At ${value.toFixed(1)}%, ${tier === 'excellent' ? 'the majority of respondents hold the brand in active memory — the strongest form of awareness, one that activates across every purchase context without any cue.' : tier === 'good' ? 'a large share of respondents carry the brand in memory without any external trigger, meaning it competes effectively even in decision contexts where advertising or point-of-sale prompts are absent.' : tier === 'moderate' ? 'approximately 1 in 5 respondents recall the brand spontaneously — real but fragmented presence. The majority of the aware base still requires a prompt, limiting competitive activation in unaided purchase situations.' : 'spontaneous recall is low. Most brand recognition is aided-only — consumers recognise the name when shown it but it rarely surfaces in unaided recall, leaving the brand dependent on paid channels to enter consideration.'}`;

      const competitive = `COMPETITIVE MEANING: ${tier === 'excellent' || tier === 'good' ? 'High spontaneous recall provides competitive insulation: even when a competitor outspends significantly on media, the brand retains strong unaided entry into consideration sets. This "recall resilience" is one of the hardest forms of brand equity to erode quickly.' : 'Competitors with higher spontaneous recall enjoy a structural advantage in every purchase context where advertising is not present. Each routine financial decision made without active comparison defaults to deeper-recall brands — a persistent conversion disadvantage.'}`;

      const consumer = `CONSUMER SIGNAL: ${tier === 'excellent' || tier === 'good' ? 'Consumers who recall a brand spontaneously are more likely to recommend it, return to it without incentive, and resist switching under competitor pressure. High spontaneous recall is both a cause and a symptom of loyalty.' : 'The current consumer relationship is primarily recognitional: aware consumers know the name but haven\'t encoded it as a first-choice association. Converting passive recognisers requires deeper, more emotionally resonant brand touchpoints — not more reach, but more resonance.'}`;

      const risk = `RISK & OPPORTUNITY: ${tier === 'excellent' || tier === 'good' ? 'Risk — spontaneous recall can erode during periods of media inactivity or brand inconsistency; memory structures degrade without reinforcement. Opportunity — strong recall provides headroom to shift investment from awareness-building to preference and loyalty conversion.' : 'Risk — aided-only recognition is fragile: it doesn\'t persist through media-dark periods, generates no word-of-mouth, and offers no competitive protection. Opportunity — the total aware base exists; converting it to spontaneous recall costs far less than building new awareness from scratch.'}`;

      const strategic = `STRATEGIC IMPLICATION: ${tier === 'excellent' || tier === 'good' ? 'With strong spontaneous recall, focus should shift to converting that recall into preference and advocacy. Investment should emphasise brand depth: distinctive experiences, service excellence, and advocacy programs that reinforce memory structures already in place.' : 'Building spontaneous recall must be the primary brand equity objective. This requires consistent, high-frequency exposure to the same distinctive brand elements — repetition of the same triggers is essential for memory encoding.'}`;

      const action = `RECOMMENDED ACTION: ${tier === 'excellent' || tier === 'good' ? 'Maintain creative consistency — the specific visual, sonic, and associative cues that built strong recall must remain stable. Avoid brand refreshes that disrupt encoding. Track spontaneous recall quarterly to catch early erosion signals.' : 'Identify the 2-3 brand triggers that most strongly associate with the brand and concentrate investment on embedding them consistently across channels. Consistent high-frequency repetition builds the memory structures needed for spontaneous recall.'}`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + cmp + smpl };
    }

    case 'total_awareness': {
      const tier = value >= 90 ? 'dominant' : value >= 70 ? 'strong' : value >= 50 ? 'moderate' : value >= 30 ? 'emerging' : 'weak';

      const snapshot =
        tier === 'dominant' ? 'Near-universal reach — virtually everyone in the market knows this brand, shifting focus entirely to awareness quality and conversion depth.'
        : tier === 'strong' ? 'High total awareness — the brand is known to a large majority of the market, making salience quality the primary growth lever rather than reach expansion.'
        : tier === 'moderate' ? 'Majority market reach with meaningful headroom — roughly half the market knows the brand, making reach and quality parallel investment priorities.'
        : tier === 'emerging' ? 'Emerging awareness footprint — the brand has a foothold but limited penetration, and reach expansion is the highest-leverage growth investment available.'
        : 'Low total awareness constrains every downstream metric — building reach is the necessary prerequisite before any other brand or commercial investment can be effective.';

      const market = `MARKET INTERPRETATION: At ${value.toFixed(1)}%, ${tier === 'dominant' ? 'the brand has reached market saturation — virtually the entire addressable market is aware of it. The growth constraint is no longer reach; it is the quality of that reach and how effectively it converts into salience, preference, and choice.' : tier === 'strong' ? 'total awareness is high — the brand is known to a substantial majority. At this level, awareness ceases to be the primary limiting factor. The barrier shifts to salience quality: how much of the aware base actively recalls the brand and considers it first.' : tier === 'moderate' ? 'the brand is known to roughly half the market — a meaningful base with significant unreached potential remaining. Both growing the aware base and improving the quality of existing awareness are live investment priorities.' : 'a significant proportion of the potential consumer base has never heard of this brand. At this level, awareness expansion must take precedence: there is no return on salience investment for consumers who don\'t yet know the brand exists.'}`;

      const competitive = `COMPETITIVE MEANING: ${tier === 'dominant' || tier === 'strong' ? 'High or near-saturated total awareness is a genuine competitive moat. New market entrants and challengers face substantial investment hurdles to reach the same level — building awareness from 0% to 70%+ in a contested market takes years and significant capital.' : 'Most established competitors hold a structural awareness advantage. The brand is fighting to be known before it can fight to be chosen — competitive parity requires sustained investment before the awareness base can support salience-building campaigns.'}`;

      const consumer = `CONSUMER SIGNAL: ${tier === 'dominant' || tier === 'strong' ? 'With near-universal or high awareness, the consumer journey starts from familiarity. The quality of awareness becomes the differentiator: consumers who know the brand superficially (aided-only) behave very differently from those who hold it in active recall.' : 'Many consumers in this market have not yet formed any relationship with the brand. Every awareness-building touchpoint is an investment in creating the foundation for future salience, preference, and loyalty.'}`;

      const risk = `RISK & OPPORTUNITY: ${tier === 'dominant' || tier === 'strong' ? 'Risk — total awareness without salience quality is a hollow metric; a brand at 80% total awareness with 10% top-of-mind is at risk of quality decay — known but not chosen. Opportunity — the aware base is the most cost-efficient pool for salience conversion; retargeting costs far less than building new awareness.' : 'Risk — the current reach base is insufficient to generate the organic word-of-mouth needed for self-sustaining growth. Opportunity — reach investment at this stage has the highest ROI in the brand lifecycle, as it unlocks all downstream metrics simultaneously.'}`;

      const strategic = `STRATEGIC IMPLICATION: ${tier === 'dominant' || tier === 'strong' ? 'Awareness quality becomes the primary KPI — specifically, how much of the total aware base is convertible to spontaneous and top-of-mind recall. Media and creative investment should optimise for salience depth rather than raw reach.' : 'Reach expansion is the single highest-priority investment. All other brand KPIs — top-of-mind, spontaneous recall, intent, preference — are capped by total awareness. Every percentage point of awareness growth unlocks a proportional pool of potential salience converters.'}`;

      const action = `RECOMMENDED ACTION: ${tier === 'dominant' || tier === 'strong' ? 'Track the awareness quality ratio (top-of-mind ÷ total awareness) quarterly. Reduce investment in pure reach campaigns and redirect toward salience-building creative — distinctiveness investment, not more impressions.' : 'Run high-reach awareness campaigns before any category-specific messaging. Prioritise channels with the highest incremental reach among the currently unaware population. Set 60% total awareness as the first milestone before transitioning to salience-building investment mode.'}`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + cmp + smpl };
    }

    case 'awareness_quality': {
      const tier = value >= 40 ? 'excellent' : value >= 25 ? 'good' : value >= 15 ? 'moderate' : value >= 10 ? 'weak' : 'poor';
      const actionNote = value < 15 ? ' Priority action: improve brand distinctiveness to convert passive recognition into active recall.' : '';

      const snapshot =
        tier === 'excellent' ? 'Excellent awareness quality — a large share of aware consumers actively recall this brand first, signalling deep and choice-relevant mental availability.'
        : tier === 'good' ? 'Good awareness quality — a healthy proportion of aware consumers hold this brand in active recall, not just passive recognition.'
        : `${tier === 'moderate' ? 'Moderate' : tier === 'weak' ? 'Weak' : 'Poor'} awareness quality — most awareness is passive recognition without active recall; the brand is known but not salient at the moment of choice.${actionNote}`;

      const market = `MARKET INTERPRETATION: At ${value.toFixed(1)}%, ${tier === 'excellent' ? 'a large proportion of aware consumers hold active recall of this brand. This quality ratio (top-of-mind ÷ total awareness) measures how "monetisable" awareness is — at 40%+, the brand\'s reach converts efficiently into spontaneous consideration.' : tier === 'good' ? 'a meaningful share of aware consumers actively recall the brand without prompting. This quality level indicates that brand investment is producing real salience, not just name familiarity — a critical distinction in how much organic consideration the brand generates.' : 'the brand has a recognition-salience gap: most aware consumers recognise the name when shown it, but few retrieve it without prompting. This "wide-but-shallow" profile is common among brands that have invested in reach without building distinctive memory triggers.'}`;

      const competitive = `COMPETITIVE MEANING: ${tier === 'excellent' || tier === 'good' ? 'High awareness quality means the brand\'s aware consumer base converts to spontaneous consideration at a strong rate — the most commercially valuable form of brand equity, generating organic consideration without requiring paid media reminders at the moment of decision.' : 'The brand\'s aware base is underperforming commercially. Consumers who recognise the brand when shown it, but don\'t recall it without a prompt, have low conversion potential — they default to higher-quality awareness brands in most unaided purchase situations.'}`;

      const consumer = `CONSUMER SIGNAL: ${tier === 'excellent' || tier === 'good' ? 'Active recall correlates with higher purchase intent, greater loyalty, and stronger advocacy — making high-quality awareness a leading indicator of brand commercial value, not just market reach.' : 'The current consumer relationship is primarily recognitional. Converting passive recognisers requires deeper, more emotionally engaging brand touchpoints — not more reach, but more resonance and distinctiveness at every interaction.'}`;

      const risk = `RISK & OPPORTUNITY: ${tier === 'excellent' || tier === 'good' ? 'Risk — awareness quality can decline silently if brand distinctiveness erodes. A brand running undifferentiated creative grows total awareness while its quality ratio falls — more consumers know the name but fewer recall it first. Opportunity — well-positioned to shift investment from awareness-building to preference-building.' : 'Risk — low awareness quality means brand investment is generating diminishing returns: every additional aware consumer added without parallel quality improvement produces less commercial value. Opportunity — improving quality does not require more reach investment; it requires better distinctiveness investment, typically at lower cost.'}`;

      const strategic = `STRATEGIC IMPLICATION: ${tier === 'excellent' || tier === 'good' ? 'With strong awareness quality, look upstream (top-of-mind growth) and downstream (intent and loyalty conversion). Ensure the quality ratio stays above 25% as total awareness grows — or the brand risks accumulating passive awareness that doesn\'t convert.' : 'Improving awareness quality must become a primary brand objective. This means investing in distinctive brand assets — visual identity, sonic cues, character, tagline — that create strong encoding at every touchpoint. Quality improvement is measured not in more consumers knowing the brand, but in more aware consumers recalling it spontaneously.'}`;

      const action = `RECOMMENDED ACTION: ${tier === 'excellent' || tier === 'good' ? 'Monitor the quality ratio quarterly and set a floor (maintain above 30%). If quality declines while total awareness grows, investigate creative for distinctiveness erosion. Invest in brand consistency — inconsistent creative execution is the most common cause of quality ratio decline.' : 'Conduct a brand distinctiveness audit: which specific cues generate the strongest spontaneous recall? Build those cues into every creative execution at higher frequency and consistency. Set a 6-month quality improvement target (e.g. +5pp) before broadening reach investment.'}`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + cmp + smpl };
    }

    case 'share_of_voice': {
      const tier = value >= 30 ? 'commanding' : value >= 20 ? 'strong' : value >= 10 ? 'competitive' : 'small';

      const snapshot =
        tier === 'commanding' ? 'Commanding share of voice — this brand dominates category top-of-mind conversations and is the primary mental reference point in its market.'
        : tier === 'strong' ? 'Strong share of voice — a significant proportion of all first-mention moments in this category belong to this brand.'
        : tier === 'competitive' ? 'Competitive but non-dominant share of voice — the brand wins meaningful but minority share of category first-recall moments.'
        : 'Small share of voice — the brand trails significantly in spontaneous market mentions and is not leading category conversations.';

      const market = `MARKET INTERPRETATION: At ${value.toFixed(1)}%, ${tier === 'commanding' ? 'this brand commands more than 1 in 3 of all top-of-mind first-mention moments in the category. This market-relative measure shows the brand not only performs strongly in absolute terms but owns a disproportionate share of the total awareness pool.' : tier === 'strong' ? 'the brand holds a strong share of category mental space — over 1 in 5 first-mention moments belong to it, a position that generates consistent organic consideration and meaningful market influence.' : tier === 'competitive' ? 'the brand wins roughly 1 in 10 spontaneous first-mention moments — a credible category participant but not a dominant mental presence.' : 'the brand captures only a small fraction of all first-mention moments. Most category conversations happen without it being top-of-mind — a structural disadvantage that limits organic growth and creates heavy dependence on paid media for consideration entry.'}`;

      const competitive = `COMPETITIVE MEANING: ${tier === 'commanding' || tier === 'strong' ? 'Strong SOV has a self-reinforcing quality: brands dominating first-mention moments gain disproportionate organic consideration, which reinforces salience, which generates more first-mention moments. This makes high-SOV positions defensible — challengers need sustained heavy investment to displace them.' : 'SOV is a relative metric — it reflects not just this brand\'s absolute performance but the competitive intensity of the market. Growing SOV through distinctive campaigns produces measurable market share gains within 12-18 months, making it one of the most evidence-based commercial investments.'}`;

      const consumer = `CONSUMER SIGNAL: ${tier === 'commanding' || tier === 'strong' ? 'Consumers naming this brand first spontaneously are demonstrating that it has become a category proxy — a mental shorthand for the entire banking category. This is the highest form of brand salience and the most reliable predictor of sustained market share.' : 'The brand\'s share of consumer first-mention is limited to a segment rather than the market-wide association that leading brands enjoy. It is prominent for some consumers but irrelevant to the majority who don\'t recall it first.'}`;

      const risk = `RISK & OPPORTUNITY: ${tier === 'commanding' || tier === 'strong' ? 'Risk — SOV can be eroded by competitor investment increases even when this brand\'s absolute awareness is stable. Monitoring SOV quarterly is essential: a brand can lose mind-share even while its absolute top-of-mind holds steady, if competitors are growing faster. Opportunity — dominant SOV enables premium pricing and reduced promotional intensity.' : 'Risk — small or moderate SOV leaves the brand exposed to SOV-driven growth by competitors. A challenger that doubles their share of first-mention moments will create measurable pressure on consideration within 2-3 quarters. Opportunity — SOV growth through distinctive campaigns produces market share gains with a relatively short lag.'}`;

      const strategic = `STRATEGIC IMPLICATION: ${tier === 'commanding' || tier === 'strong' ? 'With strong SOV, focus should shift to deepening quality metrics (awareness quality, depth score) rather than protecting raw SOV share. A brand with 30% SOV and 40% awareness quality is far stronger commercially than one with 35% SOV and 15% quality.' : 'Research consistently shows brands with SOV above their market share tend to grow market share over time — this is the Excess Share of Voice principle. Setting an explicit SOV growth target and aligning media investment against it is one of the most evidence-based approaches to brand growth.'}`;

      const action = `RECOMMENDED ACTION: ${tier === 'commanding' || tier === 'strong' ? 'Track SOV quarterly against all major competitors. A sustained 3pp+ SOV decline over 2 consecutive quarters is a leading indicator of future market share erosion — it warrants immediate investigation and tactical response.' : 'Build a SOV growth plan: identify which competitor\'s share is most directly contestable and develop a targeted campaign strategy. Measure SOV monthly during active campaign periods to track response speed and adjust.'}`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + cmp + smpl };
    }

    case 'mom_growth': {
      const isStrongGrowth = value > 5;
      const isGrowth = value > 0;
      const isDecline = value < 0;
      const isMaterialDecline = value < -5;

      const snapshot =
        isStrongGrowth ? `Awareness growing strongly (+${value.toFixed(1)}% MoM) — active momentum that is building the brand's market reach.`
        : isGrowth ? `Awareness growing modestly (+${value.toFixed(1)}% MoM) — positive trajectory with potential to accelerate through continued investment.`
        : value === 0 ? 'Awareness flat month-over-month — current investment is maintaining reach but not expanding it.'
        : isMaterialDecline ? `Material awareness decline (${value.toFixed(1)}% MoM) — a significant drop requiring immediate root-cause diagnosis before investment response.`
        : `Small awareness decline (${value.toFixed(1)}% MoM) — monitor for 2 consecutive months to determine if cyclical or structural.`;

      const market = `MARKET INTERPRETATION: ${isGrowth ? `Month-over-month growth of +${value.toFixed(1)}% indicates that the brand's market reach is actively expanding — typically 2-3 quarters before usage or market share moves. This early signal suggests current investment is generating genuine incremental reach.` : value === 0 ? 'Flat MoM awareness means the brand has reached equilibrium: campaigns are generating enough reach to replace natural awareness decay, but not enough to produce net growth. This is common for established brands with consistent but non-growing media investment.' : `Month-over-month decline of ${Math.abs(value).toFixed(1)}% is the earliest available warning signal of brand reach erosion. Without intervention, this pattern typically accelerates: each new cohort that doesn\'t encounter the brand adds to the unaware base, and the investment required to reverse the trend increases over time.`}`;

      const competitive = `COMPETITIVE MEANING: ${isGrowth ? 'Positive MoM growth means the brand is gaining mind-share. If competitors are flat or declining, this represents genuine first-mention capture. If competitors are also growing, it reflects market expansion rather than direct competitive displacement — both valuable but requiring different strategic responses.' : value === 0 ? 'Flat growth means the brand is holding position but may be losing ground if competitors are growing. The relevant question is not "are we stable?" but "are we growing as fast as the market?" Static awareness in a growing market is effective market share erosion.' : `Declining awareness while competitors hold steady means the brand is losing mind-share, not just market presence. If this pattern persists for 2+ months, it will cascade: SOV declines first, then top-of-mind, then usage — each stage 1-2 quarters behind the awareness signal.`}`;

      const consumer = `CONSUMER SIGNAL: ${isGrowth ? 'Growing awareness adds new consumers to the brand\'s consideration pool each month. These additions compound: each newly aware consumer who has a positive experience becomes a potential word-of-mouth amplifier, adding further to the organic awareness base.' : 'Declining awareness means previously aware consumers are losing their connection to the brand — through reduced media frequency, competitor displacement, or natural memory decay. Re-acquiring a lost-aware consumer costs more than retaining them, making decline prevention a priority investment.'}`;

      const risk = `RISK & OPPORTUNITY: ${isGrowth ? 'Risk — positive MoM is driven by current campaigns; without continued investment it can reverse quickly once campaigns end. Opportunity — identify which specific channels or executions are driving growth and increase their allocation before they reach saturation.' : value === 0 ? 'Risk — flat awareness is one structural change away from decline: if competitors increase investment, media costs rise, or campaign quality drops, the equilibrium breaks. Opportunity — understanding precisely which factors are keeping awareness flat (and which could be changed) is the key to unlocking growth.' : 'Risk — continued monthly decline compounds: a brand at 70% awareness declining 3% per month will be at 60% within a year. Opportunity — decline is typically faster to reverse than to build from zero, because underlying brand structures and memory traces still exist in many consumers.'}`;

      const strategic = `STRATEGIC IMPLICATION: ${isGrowth ? 'Prioritise understanding the source of growth: is it media-driven (campaign activity), organic (word-of-mouth), or structural (new distribution or channel expansion)? Each requires a different strategy to sustain and amplify.' : value === 0 ? 'Flat growth signals that the media mix needs review. Current investment is maintaining but not growing awareness — which means either a reach saturation issue (already reaching everyone reachable with current channels) or a message resonance issue.' : 'Declining awareness requires a diagnostic-first approach. Jumping to new campaigns without understanding the cause risks wasting investment. Map media spend, competitor activity, and brand events against the timing of the decline.'}`;

      const action = `RECOMMENDED ACTION: ${isGrowth ? 'Track the source of growth through media mix or channel attribution. Protect the investment generating it. Set a specific growth rate target for the next quarter and monitor weekly.' : value === 0 ? 'Review the media calendar: is the flat trajectory planned (off-cycle rest) or unplanned (saturation)? If unplanned, test a 20% increase in reach channels to see if additional investment generates proportional awareness response.' : 'Immediately diagnose the decline before investing in new campaigns. Identify whether it is timing-driven (normal recovery expected) or structural (requires intervention). Do not commit new budget until the root cause is understood.'}`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + smpl };
    }

    case 'awareness_share_index': {
      const tier = value >= 30 ? 'strong' : value >= 15 ? 'competitive' : 'small';

      const snapshot =
        tier === 'strong' ? 'Dominant awareness share index — this brand accounts for a large proportion of total category awareness and holds a structural mindshare advantage over competitors.'
        : tier === 'competitive' ? 'Competitive awareness share — the brand holds a meaningful proportion of total category awareness, indicating it is not marginal in the market landscape.'
        : 'Small awareness share — the brand accounts for a minor fraction of total category awareness and is structurally underrepresented relative to its market potential.';

      const market = `MARKET INTERPRETATION: At ${value.toFixed(1)}%, ${tier === 'strong' ? 'this brand\'s awareness accounts for a dominant share of the total category awareness pool across all tracked banks — a market-relative measure showing the brand owns a disproportionate share of consumer mind-space.' : tier === 'competitive' ? 'the brand holds a meaningful share of the total awareness pool — it is a credible category participant, though not dominant. This metric normalises for competitive intensity, showing how awareness compares to the total available mindshare in the category.' : 'the brand represents a small fraction of total category awareness. Most of the market\'s mindshare pool is held by competitor brands — this brand is structurally underrepresented relative to its potential.'}`;

      const competitive = `COMPETITIVE MEANING: ${tier === 'strong' ? 'Dominant awareness share creates a structural moat: the brand\'s combined awareness weight exceeds the sum of attention competitors can realistically focus on displacing it. This makes the position resilient — a new competitor or established rival would need to divert significant resources to match it.' : 'Brands with higher awareness share benefit from more spontaneous consumer mentions, more organic media coverage, and greater partner willingness to feature them. The brand\'s current share level limits these ambient awareness advantages.'}`;

      const consumer = `CONSUMER SIGNAL: ${tier === 'strong' ? 'Consumers in this market are more likely to encounter this brand organically — through word-of-mouth, media coverage, peer conversations, and environmental cues — than to encounter competitors. This ambient exposure reinforces salience without requiring direct brand investment.' : 'With a limited awareness share, the brand must rely more heavily on paid media to maintain presence in consumer memory. Fewer consumers are talking about it, fewer media sources reference it, and fewer environmental cues reinforce it between purchase occasions.'}`;

      const risk = `RISK & OPPORTUNITY: ${tier === 'strong' ? 'Risk — high awareness share can mask quality problems; a brand at 35% awareness share with poor salience quality is overextended. Opportunity — leverage awareness share dominance to anchor brand extensions or new product launches with reduced awareness investment requirements.' : 'Risk — small awareness share means the brand has limited ability to sustain awareness without paid media; any investment reduction will produce faster relative decay than for higher-share competitors. Opportunity — even modest awareness share growth produces disproportionate market impact in fragmented categories.'}`;

      const strategic = `STRATEGIC IMPLICATION: ${tier === 'strong' ? 'With dominant awareness share, focus should be on quality: converting the large awareness pool into higher-quality spontaneous recall and top-of-mind. Awareness growth at this stage produces declining returns; quality improvement does not.' : 'Awareness share growth should be a medium-term strategic objective. Identifying which competitor\'s awareness is most contestable — where consumer awareness is weakest relative to their offering — provides the most efficient path to growing share.'}`;

      const action = `RECOMMENDED ACTION: ${tier === 'strong' ? 'Monitor awareness share quarterly against all tracked competitors. A sustained 2-3pp decline over 2 quarters signals competitive encroachment and warrants investment response before it affects top-of-mind share.' : 'Build awareness share growth into the strategic plan with a specific target (e.g., from 12% to 18% in 24 months). Identify which competitor\'s awareness is most directly substitutable and direct reach campaigns at their consumer base.'}`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + cmp + smpl };
    }

    case 'awareness_depth_score': {
      const tier = value >= 60 ? 'excellent' : value >= 40 ? 'good' : value >= 20 ? 'moderate' : 'weak';

      const snapshot =
        tier === 'excellent' ? `Excellent awareness depth (${value.toFixed(0)}/100) — awareness is active, choice-relevant, and encodes strongly in unaided recall contexts across the category.`
        : tier === 'good' ? `Good awareness depth (${value.toFixed(0)}/100) — a strong proportion of the brand's awareness is active recall rather than passive recognition.`
        : tier === 'moderate' ? `Moderate awareness depth (${value.toFixed(0)}/100) — a mix of active and passive awareness; the brand is recognisable but not consistently salient in unaided contexts.`
        : `Weak awareness depth (${value.toFixed(0)}/100) — awareness is predominantly passive recognition, limiting competitive activation where no external prompt is present.`;

      const market = `MARKET INTERPRETATION: A depth score of ${value.toFixed(0)}/100 reflects a weighted composite that favours top-of-mind and spontaneous recall over aided-only recognition (weighted 3:2:1). ${tier === 'excellent' ? 'At this level, the brand\'s awareness is highly active — a large proportion of aware consumers will encounter and recall the brand in decision contexts without any prompt. This is the most commercially valuable form of awareness.' : tier === 'good' ? 'The brand has meaningful active recall alongside its passive recognition base. A significant proportion of aware consumers will recall the brand without prompting — a strong competitive position that supports organic consideration.' : 'Most aware consumers fall in the aided-only category: they recognise the brand when shown it but don\'t retrieve it in unaided contexts. The depth score is dragged down by this passive recognition majority.'}`;

      const competitive = `COMPETITIVE MEANING: ${tier === 'excellent' || tier === 'good' ? 'High depth scores provide competitive insulation in every unpropted purchase situation. Brands with higher depth scores win the consideration default whenever consumers make a decision without active comparison — the majority of routine financial choices.' : 'Competitors with higher depth scores enjoy a significant activation advantage in unaided purchase situations. Every interaction where a consumer isn\'t actively comparing — the majority of routine banking decisions — defaults to deeper-recall brands, representing a persistent conversion disadvantage.'}`;

      const consumer = `CONSUMER SIGNAL: ${tier === 'excellent' || tier === 'good' ? 'Consumers interacting with this brand come to it with a higher-quality mental relationship than those who only recognise it when shown it. High-depth consumers are more likely to seek out the brand, mention it in conversation, and choose it without extensive comparison shopping.' : 'The brand\'s consumer base includes a high proportion of "passive recognisers" — consumers who know the name but don\'t think of it when making a banking decision. Converting them to active recall requires more memorable brand touchpoints, not more reach.'}`;

      const risk = `RISK & OPPORTUNITY: ${tier === 'excellent' || tier === 'good' ? 'Risk — depth scores decline gradually as creative becomes less distinctive or as competitor attention increases. Monitor quarterly; a 5+ point drop in depth score over 2 periods warrants immediate creative review. Opportunity — high depth enables a shift from reach investment to preference and loyalty investment.' : 'Risk — brands with weak depth scores are structurally disadvantaged in any context where there is no external prompt. Opportunity — depth improvement typically produces faster top-of-mind and SOV gains than awareness expansion, at lower cost, making it one of the best-ROI investments at this brand stage.'}`;

      const strategic = `STRATEGIC IMPLICATION: ${tier === 'excellent' || tier === 'good' ? 'With strong depth, focus should shift to converting active recall into strong preference and advocacy. Investment should emphasise deepening the brand relationship with high-depth consumers rather than broadening reach to passive recognisers.' : 'Improving depth score must be a primary brand investment objective. Brands improve depth by being more memorable — not by reaching more consumers with the same message, but by embedding specific, distinctive brand triggers consistently across every touchpoint.'}`;

      const action = `RECOMMENDED ACTION: ${tier === 'excellent' || tier === 'good' ? 'Track depth score monthly, especially during creative refresh periods — distinctiveness erosion is the most common cause of depth decline. Ensure brand asset guidelines (visual identity, sonic cues, character) are strictly applied across all creative executions.' : 'Run a brand memory audit: identify the triggers that most reliably activate unaided brand recall and concentrate investment on embedding them consistently. Set a 6-month depth score improvement target (e.g., +10 points) as a campaign success metric alongside reach metrics.'}`;

      return { snapshot, detail: s(market, competitive, consumer, risk, strategic, action) + cmp + smpl };
    }

    default:
      return null;
  }
}

// ─── Funnel insight builder ───────────────────────────────────────────────────

export function buildAwarenessFunnelInsight(args: FunnelInsightArgs): AwarenessInsightResult | null {
  const { aware, spontaneous, topOfMind, aided } = args;
  if (aware === null || !isFinite(aware) || aware === 0) return null;

  const spontRate = spontaneous !== null && isFinite(spontaneous) ? spontaneous / aware : null;
  const tomRate = topOfMind !== null && isFinite(topOfMind) ? topOfMind / aware : null;

  const isStrongSpont = spontRate !== null && spontRate >= 0.6;
  const isWeakSpont = spontRate !== null && spontRate < 0.35;
  const isWeakToM = tomRate !== null && tomRate < 0.1;
  const isStrongToM = tomRate !== null && tomRate >= 0.3;

  const spontPct = spontaneous !== null ? ((spontaneous / aware) * 100).toFixed(0) : '--';
  const tomPct = topOfMind !== null ? ((topOfMind / aware) * 100).toFixed(0) : '--';

  const snapshot =
    isStrongSpont && isStrongToM
    ? 'The awareness funnel shows strong conversion from recognition to active recall — a high proportion of the aware base recalls the brand spontaneously and as their first choice.'
    : isWeakSpont && isWeakToM
    ? 'The awareness funnel reveals a significant salience gap — most aware consumers recognise the brand but few recall it actively, signalling passive-only awareness that limits commercial conversion.'
    : isWeakSpont
    ? 'The funnel shows low spontaneous conversion — most brand awareness is passive recognition that doesn\'t activate in unaided decision contexts.'
    : isWeakToM
    ? 'The funnel shows reasonable spontaneous recall but weak top-of-mind conversion — the brand is known but rarely the first consumers name.'
    : 'The awareness funnel shows healthy but improvable conversion from recognition to active recall, with specific opportunities in top-of-mind depth.';

  const funnelProfile = `FUNNEL PROFILE: ${
    isStrongSpont && isStrongToM
    ? 'Strong active recall conversion — '
    : isWeakSpont
    ? 'Passive recognition-heavy profile — '
    : 'Moderate funnel conversion — '
  }the aware base (${aware.toFixed(0)}% of total sample) converts at ${spontPct}% to spontaneous recall${topOfMind !== null ? ` and ${tomPct}% to top-of-mind` : ''}. ${aided !== null && spontaneous !== null ? `Aided-only recognition accounts for ${(aided - spontaneous).toFixed(0)}pp of the total sample.` : ''}`;

  const marketContext = `MARKET CONTEXT: ${isStrongSpont ? 'The funnel converts efficiently — a large share of the aware base has moved from recognition to active recall. This indicates brand investment is producing genuine salience, not just surface recognition. The brand enters unaided decision contexts at a rate that most competitors cannot easily match.' : isWeakSpont ? 'The funnel reveals a conversion gap between awareness and salience. The brand is reaching consumers — they recognise it — but it hasn\'t built the memory structures needed for unaided activation. This is the hallmark of reach-heavy investment without corresponding distinctiveness work.' : 'The funnel shows moderate conversion from recognition to spontaneous recall. Performance at the aware-to-spontaneous stage is acceptable, but top-of-mind conversion presents a specific, high-return opportunity.'}`;

  const competitivePosition = `COMPETITIVE POSITION: Banking category leaders typically convert 50–60% of their aware base to spontaneous recall and 25–35% to top-of-mind. At ${spontPct}% spontaneous conversion, this brand ${
    spontRate === null ? 'has insufficient data to benchmark against category norms.'
    : spontRate >= 0.5 ? 'meets or exceeds category leader benchmarks — a genuinely strong funnel that provides competitive insulation in unaided purchase situations.'
    : spontRate >= 0.35 ? 'sits in the competitive middle band — credible but not yet at category leader conversion rates. Sustained distinctiveness investment over 2-3 campaign cycles can close this gap.'
    : 'trails category leader benchmarks materially, a competitive disadvantage in every unaided purchase situation. Competitors achieving 50%+ spontaneous conversion win a disproportionate share of routine banking decisions without paid media support.'
  }${topOfMind !== null ? ` Top-of-mind conversion at ${tomPct}% ${tomRate !== null && tomRate >= 0.25 ? 'meets category leader norms.' : 'trails category leader norms — the brand is present in consideration but rarely the instinctive first choice.'}` : ''}`;

  const consumer = `CONSUMER SIGNAL: ${isWeakToM ? 'The brand is known but rarely the first recalled — consumers are processing it as a secondary option rather than a category anchor. In markets where choice is made quickly and instinctively, this "known but not first" position translates directly into lost conversion opportunities.' : isStrongToM ? 'The brand benefits from strong instinctive recall — a significant share of aware consumers name it first. This indicates the brand has moved beyond recognition into habitual salience, the highest form of consumer brand relationship.' : 'The aware base is split between active and passive recall. Active-recall consumers behave like brand advocates; passive-recall consumers behave like market browsers evaluating multiple options — a meaningful distinction for conversion rate expectations.'}`;

  const opportunityRisk = `OPPORTUNITY/RISK: ${isWeakSpont ? 'Risk — passive-heavy awareness is fragile: it generates no word-of-mouth, provides no competitive protection, and decays faster during media-dark periods. Opportunity — investing in distinctiveness (not more reach) can shift this conversion ratio significantly within 2-3 campaign cycles, at lower cost than building new awareness.' : 'Risk — if funnel conversion is not actively managed, total awareness can grow while spontaneous and top-of-mind ratios decline — a "hollow awareness" pattern that reduces commercial return on brand investment. Opportunity — the existing aware base is the most cost-efficient pool for salience conversion.'}`;

  const strategicPriority = `STRATEGIC PRIORITY: ${isWeakSpont || isWeakToM ? `The brand needs a salience conversion strategy, not a reach strategy. Investment should shift from building more awareness to deepening the quality of existing awareness — specifically targeting the ${isWeakSpont ? 'spontaneous recall' : 'top-of-mind'} conversion rate. Run a distinctiveness audit to identify which brand cues most strongly generate spontaneous recall in this category. Redirect investment from broad reach to high-frequency distinctiveness-led creative for 2-3 consecutive months. Measure spontaneous/aware conversion monthly.` : 'With a healthy funnel shape, the brand is well-positioned to focus on downstream metrics — preference, intent, and loyalty. Monitor funnel conversion rates monthly. Set conversion floor targets: spontaneous/aware ≥ 40%, top-of-mind/aware ≥ 20%. If either ratio declines for 2 consecutive months, investigate creative distinctiveness and media mix.'}`;

  return { snapshot, detail: s(funnelProfile, marketContext, competitivePosition, consumer, opportunityRisk, strategicPriority) };
}

// ─── Rankings insight builder ─────────────────────────────────────────────────

export function buildAwarenessRankingInsight(args: RankingInsightArgs): AwarenessInsightResult | null {
  const { rows, selectedBankId, sampleSize } = args;
  if (!rows.length) return null;

  const bankRow = rows.find((r) => r.bankId === selectedBankId);
  if (!bankRow) return null;

  const { rank, bankName, awareness, topOfMind, movement } = bankRow;
  const total = rows.length;
  const leader = rows[0];
  const isLeader = leader.bankId === selectedBankId;

  const rankDesc = rank === 1 ? 'market leader in awareness'
    : rank === 2 ? 'second in the competitive awareness rankings'
    : rank <= Math.ceil(total / 2) ? 'in the upper half of the competitive field'
    : 'in the lower half of the competitive field';

  const movementDesc = movement == null ? ''
    : movement > 0 ? ` Rank improved by ${movement} position${movement > 1 ? 's' : ''}.`
    : movement < 0 ? ` Rank dropped by ${Math.abs(movement)} position${Math.abs(movement) > 1 ? 's' : ''}.`
    : ' Rank was stable since last period.';

  const gapDesc = !isLeader && leader
    ? ` ${leader.awareness - awareness}pp gap to market leader ${leader.bankName}.`
    : '';

  const snapshot = `${bankName} ranks #${rank} of ${total} banks — ${rankDesc} (${awareness}% awareness, ${topOfMind}% top-of-mind).${movementDesc}${gapDesc}${sampleSize < LOW_SAMPLE ? ' Low sample — interpret directionally.' : ''}`;

  const competitors = rows
    .filter((r) => r.bankId !== selectedBankId)
    .slice(0, 4)
    .map((r) => `${r.bankName} (${r.awareness}% awareness, ${r.topOfMind}% top-of-mind, rank #${r.rank})`)
    .join('; ');

  const position = `COMPETITIVE POSITION: ${bankName} holds rank #${rank} of ${total} tracked banks on total awareness (${awareness}%), with top-of-mind at ${topOfMind}%. ${rankDesc.charAt(0).toUpperCase() + rankDesc.slice(1)}. ${movement != null ? (movement > 0 ? `Rank improvement of ${movement} position${movement > 1 ? 's' : ''} signals positive competitive momentum.` : movement < 0 ? `Rank drop of ${Math.abs(movement)} position${Math.abs(movement) > 1 ? 's' : ''} is a warning signal requiring attention.` : 'Rank stability indicates the brand is holding ground against competitor investment.') : 'No prior-period rank data available for movement analysis.'}`;

  const landscape = `MARKET LANDSCAPE: Key competitors tracked: ${competitors || 'No other banks in this slice.'}`;

  const gap = `GAP ANALYSIS: ${isLeader ? `${bankName} holds the top awareness position. The priority is extending the lead on quality metrics — top-of-mind and depth score — rather than defending raw awareness reach. Rank #1 in awareness does not guarantee rank #1 in spontaneous consideration.` : `Closing the ${(leader.awareness - awareness).toFixed(0)}pp gap to market leader ${leader.bankName} (${leader.awareness}% awareness) requires sustained investment. A 5pp annual awareness gain is achievable with consistent media presence; a 10pp+ gain requires either campaign intensity or a significant brand event.`}`;

  const movement2 = `RANK MOVEMENT: ${movement == null ? 'No prior-period data available for movement comparison.' : movement > 0 ? `Rank improvement of ${movement} position${movement > 1 ? 's' : ''} indicates the brand is gaining mind-share relative to competitors — a positive leading signal that typically precedes awareness percentage gains by 1-2 months.` : movement < 0 ? `Rank drop of ${Math.abs(movement)} position${Math.abs(movement) > 1 ? 's' : ''} is a warning signal. Rank declines typically precede awareness percentage drops by 1-2 months — meaning the commercial impact of this move has not yet fully materialised.` : 'Rank stability shows the brand is holding ground, but competitors are also holding their positions — no one is gaining material share.'}`;

  const strategicPriority = `STRATEGIC PRIORITY: ${rank === 1 ? 'Market awareness leadership is the most defensible position in the competitive set. Extend the lead on quality metrics — particularly top-of-mind and depth score — which predict usage and advocacy better than raw total awareness. Track the awareness gap to #2 quarterly — a sustained narrowing of 2pp+ over 2 periods warrants a defensive investment response. Monitor top-of-mind and depth score to ensure awareness leadership translates into quality leadership.' : rank === 2 ? `As the closest challenger to ${leader.bankName}, a focused campaign targeting the ${(leader.awareness - awareness).toFixed(0)}pp gap could shift the market balance. Identify which specific consumer segment the leader is weakest in and concentrate efforts there. Set a specific rank improvement target and identify which channel or segment drove the competitor currently ahead to their position.` : `Focus on moving up one rank position at a time. Identify the bank immediately above and target their weakest demographic segment with tailored messaging and media investment. Set a specific rank improvement target (reach rank #${rank - 1} within 12 months).`}${sampleSize < LOW_SAMPLE ? ' Note: Ranking comparisons at this sample size are directional only.' : ''}`;

  const smpl = smplSection(sampleSize);

  return { snapshot, detail: s(position, landscape, gap, movement2, strategicPriority) + smpl };
}

// ─── Intent insight builder ───────────────────────────────────────────────────

export function buildIntentInsight(args: IntentInsightArgs): AwarenessInsightResult | null {
  const { averageIntent, highIntentPct, highIntentNonUserPct, lowIntentCurrentUserCount, responseBase } = args;
  if (responseBase === 0) return null;

  const intentLevel = averageIntent >= 8 ? 'very high' : averageIntent >= 6.5 ? 'high' : averageIntent >= 5 ? 'moderate' : 'low';
  const hasStrongPipeline = highIntentNonUserPct > 0.25;
  const hasModeratePipeline = highIntentNonUserPct > 0.10 && !hasStrongPipeline;
  const hasChurnRisk = lowIntentCurrentUserCount > 10;
  const hasSubduedIntent = highIntentPct < 0.25;

  const snapshot = `Average intent of ${averageIntent.toFixed(1)}/10 among ${responseBase} aware respondents is ${intentLevel}.${hasStrongPipeline ? ` ${Math.round(highIntentNonUserPct * 100)}% of non-users show high intent — strong acquisition pipeline.` : hasModeratePipeline ? ` ${Math.round(highIntentNonUserPct * 100)}% of non-users show high intent — moderate acquisition opportunity.` : ''}${hasChurnRisk ? ` ${lowIntentCurrentUserCount} current users show low intent — material churn risk.` : ''}${hasSubduedIntent ? ' Overall intent is subdued.' : ''}`;

  const profile = `INTENT PROFILE: Average intent of ${averageIntent.toFixed(1)}/10 among ${responseBase} aware respondents is ${intentLevel}. ${Math.round(highIntentPct * 100)}% of aware respondents score 7-10 (high intent). Intent is a forward-looking measure: it captures not how consumers feel about the brand today, but whether they plan to use or consider it — the earliest available signal of future consideration conversion.`;

  const pipeline = `ACQUISITION PIPELINE: ${hasStrongPipeline ? `${Math.round(highIntentNonUserPct * 100)}% of non-users show high intent (7-10) — a strong, warm acquisition pipeline. These respondents are aware, interested, but not yet customers. They represent the highest-probability acquisition targets: they don't need awareness investment, they need a converting offer. Priority should be to activate this pipeline before it decays or competitor brands capture it.` : hasModeratePipeline ? `${Math.round(highIntentNonUserPct * 100)}% of non-users show high intent — a moderate pipeline. These leads are warm; nurturing them through targeted consideration-stage content (product benefits, comparisons, proof points) should yield above-average conversion rates at lower cost than acquiring cold prospects.` : 'The acquisition pipeline among high-intent non-users is thin. Awareness investment alone is unlikely to drive new acquisition — consideration barriers need to be investigated: what is preventing aware, potentially interested non-users from moving toward the brand?'}`;

  const churn = `RETENTION RISK: ${hasChurnRisk ? `${lowIntentCurrentUserCount} current users score ≤6 on future intent — a material churn pool. Low intent among current users is the earliest measurable signal of pending attrition, typically 1-2 quarters before actual churn behaviour. These consumers should be identified and targeted with retention interventions immediately — waiting for usage decline before responding is significantly more expensive.` : lowIntentCurrentUserCount > 0 ? `${lowIntentCurrentUserCount} current users show low intent — a small but real signal. Monitor whether this number grows month-over-month; two consecutive months of growth warrants a targeted retention response.` : 'Current user intent appears healthy — low immediate churn risk from intent data. Continue to monitor quarterly.'}`;

  const consumer = `CONSUMER SIGNAL: ${intentLevel === 'very high' || intentLevel === 'high' ? 'High average intent indicates that the aware consumer base is positively pre-disposed toward the brand — a strong foundation for conversion campaigns and loyalty investment. Aware consumers at this intent level are significantly closer to action than the market average.' : intentLevel === 'moderate' ? 'Moderate intent suggests a mixed consumer pre-disposition: some aware consumers are close to action, but a significant portion is neutral or passive. Understanding what drives the neutral cohort — price, trust, inertia, competitor preference — is the key diagnostic question.' : 'Low average intent among aware consumers is a serious signal: these respondents know the brand but are not moved toward it. This "aware but uninterested" cohort indicates either a product/service gap or an unresolved brand barrier that awareness investment cannot solve.'}`;

  const strategicPriority = `STRATEGIC PRIORITY: ${hasStrongPipeline ? 'With a strong acquisition pipeline among high-intent non-users, the highest-return investment is targeted conversion activity — offers, trials, or direct activation campaigns aimed at this specific cohort. Run targeted activation campaigns to the high-intent non-user cohort. Use direct response channels (digital, SMS, direct mail) with a specific converting offer. Measure conversion from this segment separately from broad awareness campaign results.' : hasChurnRisk ? 'The retention risk from low-intent current users should be treated as the highest-priority commercial intervention. Churn is expensive to reverse — a current user who defects requires significant acquisition investment to replace. Deploy proactive retention: personalised outreach, service quality signals, and loyalty mechanics. Do not wait for usage to drop before intervening.' : hasSubduedIntent ? 'Subdued overall intent suggests a consideration barrier that reach investment alone cannot solve. Investigate intent barriers with qualitative research. Identify the specific beliefs, concerns, or competitor associations preventing aware non-users from forming high intent. This insight should directly inform the next messaging strategy.' : 'Intent is healthy — the focus should be on activating the high-intent pipeline into conversion, and monitoring the churn risk segment for early movement. Set a 3-month nurture sequence for mid-intent non-users and measure pipeline conversion monthly.'}${hasChurnRisk ? ' For at-risk current users, deploy proactive retention: personalised outreach, service quality signals, and loyalty mechanics. Do not wait for usage decline before responding.' : ''}`;

  return { snapshot, detail: s(profile, pipeline, churn, consumer, strategicPriority) };
}

// ─── Module summary insight builder ──────────────────────────────────────────

export function buildAwarenessModuleSummary(payload: AwarenessReportPayload): AwarenessInsightResult | null {
  const { metrics, sampleSize } = payload;
  const { topOfMind, totalAwareness, awarenessQuality } = metrics;

  if (totalAwareness === null || sampleSize === 0) return null;

  const hasStrongToM = topOfMind !== null && topOfMind >= 20;
  const hasWeakQuality = awarenessQuality !== null && awarenessQuality < 20;
  const hasLowAwareness = totalAwareness < 50;

  let pattern = '';
  let patternBody = '';
  let strategicFocus = '';
  let primaryAction = '';

  if (hasLowAwareness && hasStrongToM) {
    pattern = 'Hidden Gem';
    patternBody = 'Strong salience within a limited aware base — the brand punches above its weight in top-of-mind among those who know it, but most of the market hasn\'t yet been reached. This is a highly efficient salience profile trapped by insufficient reach.';
    strategicFocus = 'Scale awareness reach. The brand has proven salience efficiency — more reach investment will compound disproportionately because the conversion infrastructure is already in place.';
    primaryAction = 'Run high-reach campaigns in currently underserved segments. Track whether top-of-mind share is maintained as total awareness grows — if it holds or grows, the brand has genuinely scalable salience.';
  } else if (hasStrongToM && awarenessQuality !== null && awarenessQuality >= 25) {
    pattern = 'Salience Leader';
    patternBody = 'Strong top-of-mind and high awareness quality — the brand converts its aware base into active recall effectively. A large share of consumers who know the brand also hold it as a first-choice association. This is the most commercially advantaged awareness profile.';
    strategicFocus = 'Defend the position and extend into quality metrics. Protect share of voice, maintain brand distinctiveness, and focus investment on awareness depth score and spontaneous recall breadth.';
    primaryAction = 'Monitor awareness quality ratio quarterly — a decline of 3pp+ over 2 periods without a corresponding drop in total awareness signals passive awareness accumulation and requires creative review.';
  } else if (!hasLowAwareness && hasWeakQuality) {
    pattern = 'Recognised but Forgotten';
    patternBody = 'High total awareness but weak salience conversion — respondents know the brand name when prompted but rarely recall it first. This wide-but-shallow awareness profile is the most common and most costly form of brand investment misalignment: reach investment is working, but it\'s building recognition without building recall.';
    strategicFocus = 'Shift investment from reach to distinctiveness. The brand does not need more consumers to know its name — it needs more aware consumers to hold it in active recall. This requires a creative and distinctiveness investment, not a media-weight investment.';
    primaryAction = 'Commission a brand distinctiveness audit. Identify which memory triggers most reliably generate spontaneous recall in this category and embed them at higher frequency and consistency across all creative. Set a 6-month awareness quality improvement target (e.g. +5pp).';
  } else if (hasLowAwareness && hasWeakQuality) {
    pattern = 'Fundamental Rebuild Required';
    patternBody = 'Both total awareness and awareness quality are below critical thresholds — limited reach and limited salience depth. The brand has neither the market presence nor the quality of presence needed to generate meaningful organic consideration. Both problems require simultaneous investment.';
    strategicFocus = 'Build from foundations: prioritise reach investment to grow the aware base while simultaneously developing distinctive brand assets that enable quality conversion. These must be parallel workstreams, not sequential ones.';
    primaryAction = 'Set milestone targets: total awareness to 50% within 18 months, awareness quality to 20% within 24 months. Allocate investment 60/40 between reach (to grow the base) and distinctiveness (to build quality), and review the ratio quarterly.';
  } else {
    pattern = 'Developing';
    patternBody = 'Awareness and quality metrics are at emerging levels — the brand is building its foundation. Neither total awareness nor awareness quality has yet reached the thresholds that drive consistent organic consideration, but the profile is not deeply imbalanced.';
    strategicFocus = 'Monitor both reach and quality metrics monthly with equal attention. At this stage, one metric racing ahead of the other creates an imbalance that becomes harder to correct later.';
    primaryAction = 'Set milestone targets: total awareness to 50% (reach milestone) and awareness quality to 20% (quality milestone) as the two leading indicators. Build these into planning cycle KPIs.';
  }

  const smallSampleNote = sampleSize < 50 ? ` (small sample — treat directionally)` : '';

  const snapshot = `Awareness pattern: ${pattern}. ${patternBody.split('.')[0]}.${smallSampleNote}`;

  const patternSection = `AWARENESS PATTERN — ${pattern.toUpperCase()}: ${patternBody}`;
  const metricsSection = `KEY METRICS: Total awareness ${totalAwareness.toFixed(0)}%${topOfMind !== null ? ` · Top-of-mind ${topOfMind.toFixed(0)}%` : ''}${awarenessQuality !== null ? ` · Awareness quality ${awarenessQuality.toFixed(0)}%` : ''}. Sample: ${sampleSize} respondents.${smallSampleNote}`;
  const focusSection = `STRATEGIC FOCUS: ${strategicFocus}`;
  const actionSection = `PRIMARY ACTION: ${primaryAction}`;
  const context = `INTERPRETATION CONTEXT: Awareness quality (top-of-mind ÷ total awareness) is the most diagnostic ratio in this module. At 25%+, a brand is converting its aware base into active recall efficiently. Below 15%, the brand has a reach-salience gap that compounds over time — awareness investment adds reach but not choice-relevance, and the ROI on that investment degrades unless the quality gap is closed.`;

  return { snapshot, detail: s(patternSection, metricsSection, focusSection, actionSection, context) };
}
