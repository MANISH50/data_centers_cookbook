/* ==========================================================================
   HOW AN AI ANSWERS: the self-playing walkthrough of real photos. Content only, no logic.
   Edit text here, then run:  node llm/prerender.mjs
   Each chapter is a list of beats. A beat = a caption shown for `d` seconds over a real photo:
     photo: an id from PHOTOS · focus: [u, v, zoom] the part of the photo to centre (u across, v down, 0..1)
     plabels: [[text, [u, v]], …] labels pinned to the photo · cue: a small flat diagram (diagrams.js) for ideas
     a camera can't see · stat: [value, label, sourceId] · p0/p1: diagram progress range · try: a Try it panel.
   Every number here comes from the sources listed in SOURCES. Anthropic does not publish the size of its
   models, so sizes use GPT-3 (published in 2020) as a public example. Photos: Wikimedia Commons, credited in PHOTOS.
   ========================================================================== */

export const SOURCES = [
  { id: 'transformer', t: 'Vaswani et al., "Attention Is All You Need" (2017): the Transformer, built on attention', u: 'https://arxiv.org/abs/1706.03762' },
  { id: 'gpt3', t: 'Brown et al., "Language Models are Few-Shot Learners" (2020): GPT-3, 175 billion parameters, 96 layers, 12,288 numbers per token, 96 attention heads, a 2,048-token context', u: 'https://arxiv.org/abs/2005.14165' },
  { id: 'bpe', t: 'Sennrich et al., "Neural Machine Translation of Rare Words with Subword Units" (2016): splitting words into subword tokens (byte-pair encoding)', u: 'https://arxiv.org/abs/1508.07909' },
  { id: 'tokens', t: 'Anthropic, Claude docs, Glossary: a token is about 3.5 English characters on earlier models; the newest tokenizer gives about 30% more tokens for the same text', u: 'https://docs.claude.com/en/docs/about-claude/glossary' },
  { id: 'models', t: 'Anthropic, Claude docs, Models overview: context windows of up to 1 million tokens', u: 'https://docs.claude.com/en/docs/about-claude/models/overview' },
  { id: 'kaplan', t: 'Kaplan et al., "Scaling Laws for Neural Language Models" (2020): a forward pass costs about 2 operations per parameter for each token', u: 'https://arxiv.org/abs/2001.08361' },
  { id: 'h100', t: 'NVIDIA H100 Tensor Core GPU specifications (SXM): 80 GB of memory, 3.35 TB/s memory bandwidth, 1,979 teraFLOPS FP16 Tensor Core (with sparsity), NVLink 900 GB/s, up to 700 W', u: 'https://www.nvidia.com/en-us/data-center/h100/' },
  { id: 'hbm', t: 'Wikipedia, High Bandwidth Memory: memory dies stacked on top of each other, joined by through-silicon vias, beside the processor', u: 'https://en.wikipedia.org/wiki/High_Bandwidth_Memory' },
  { id: 'tpu', t: 'Wikipedia, Tensor Processing Unit: Google’s custom chip for neural networks (since 2015), built around a systolic array', u: 'https://en.wikipedia.org/wiki/Tensor_Processing_Unit' },
  { id: 'kvcache', t: 'Hugging Face Transformers docs, Caching: the key-value (KV) cache keeps earlier tokens’ attention keys and values so they are not recomputed', u: 'https://huggingface.co/docs/transformers/en/kv_cache' },
  { id: 'nucleus', t: 'Holtzman et al., "The Curious Case of Neural Text Degeneration" (2019): nucleus (top-p) sampling', u: 'https://arxiv.org/abs/1904.09751' },
  { id: 'flash', t: 'Dao et al., "FlashAttention" (2022): faster attention by reading and writing memory less', u: 'https://arxiv.org/abs/2205.14135' },
  { id: 'specdec', t: 'Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2022): several tokens at once, with no change to the output', u: 'https://arxiv.org/abs/2211.17192' },
  { id: 'stream', t: 'Anthropic, Claude docs, Streaming messages: answers arrive bit by bit as server-sent events', u: 'https://docs.claude.com/en/docs/build-with-claude/streaming' },
  { id: 'nvl72', t: 'NVIDIA DGX B300 user guide and Supermicro GB300 NVL72 datasheet: 72 GPUs in one liquid-cooled rack, about 132–140 kW (as in Issue 01)' },
  { id: 'anthropic', t: 'Anthropic and partner announcements on Claude’s compute: AWS Trainium, Google TPUs and NVIDIA GPUs (as in Issue 01)' },
  { id: 'gemini', t: 'Google, "Measuring the environmental impact of AI inference" (Aug 2025): 0.24 Wh and 0.26 ml of water for a median Gemini text prompt (as in Issue 01)' }
];

const b = (text, x = {}) => ({ d: 11.5, text, ...x });

export const CHAPTERS = [
  { id: 'ch1', title: 'You press Enter', sub: 'One message, start to finish', where: 'Your device',
    beats: [
      b('You type a question into a chat and press Enter. A second later, words start appearing, one after another. Where do they come from?', { photo: 'typing' }),
      b('Not from your phone. Your message travels to a data center, where a big AI model runs on special chips, and the answer streams back.', { photo: 'cern-hall', cue: 'journey', p0: 0, p1: 1 }),
      b('Along the way your words turn into numbers, pass through dozens of layers of maths, and come out as a guess for the next word. Then again, and again.', { photo: 'code', cue: 'journey', p0: 1 }),
      b('This walkthrough follows that one message. It starts simple and goes deep: tokens, attention, the chips, their memory, and the tricks that make it fast.', { photo: 'wmf-racks' })
    ] },
  { id: 'ch2', title: 'The trip to the data center', sub: 'Your message on the move', where: 'The internet',
    beats: [
      b('Your app wraps the message in an encrypted request and sends it over the internet, like any web page. Issue 06 follows that trip in detail.', { photo: 'fibre' }),
      b('It arrives at an AI provider’s servers. A front door checks who you are and your limits, then a scheduler picks a group of chips with room for one more conversation.', { photo: 'switches', cue: 'arrive', p0: 0, p1: 1 }),
      b('Your whole conversation goes with it: earlier questions, earlier answers and any files. A model has no memory between requests; it rereads the conversation every time.', { photo: 'library' })
    ] },
  { id: 'ch3', title: 'Words become tokens', sub: 'Cutting text into pieces', where: 'A server, on ordinary processors',
    beats: [
      b('The model can’t read letters. First a tokenizer cuts your text into tokens: common words, pieces of words, spaces and punctuation.', { photo: 'catalog', cue: 'tokens', p0: 0, p1: .5, try: 'tokens' }),
      b('Common words stay whole. A rare word is split into familiar pieces, so the model never meets a word it can’t handle. The method is called byte-pair encoding.', { photo: 'catalog', focus: [.45, .5, 1.4], cue: 'tokens', p0: .5, p1: 1, src: 'bpe', try: 'tokens' }),
      b('Anthropic says a token is about 3.5 English characters on its earlier models, and its newest tokenizer makes about 30% more tokens for the same text.', { photo: 'catalog', focus: [.6, .45, 1.2], stat: ['≈ 3.5', 'English characters per token (earlier Claude models)', 'tokens'], try: 'tokens' }),
      b('Each token is really a number: its place in a fixed list of tens of thousands of pieces, the vocabulary. “Hello” might be one number, “Hellooo” three.', { photo: 'catalog', cue: 'vocab', try: 'tokens' }),
      b('Some tokens are special markers the app adds: where a message starts and ends, and who is speaking, so the model can tell your words from its own.', { photo: 'catalog', focus: [.4, .6, 1.3], try: 'tokens' })
    ] },
  { id: 'ch4', title: 'Tokens become meaning', sub: 'Embeddings: a list of numbers per token', where: 'The AI chips',
    beats: [
      b('Now the chips take over. Each token number picks out a row in a huge table: a long list of numbers that stands for what the token means. This is its embedding.', { photo: 'h100s', cue: 'embed', p0: 0, p1: .5, plabels: [['GPUs, under their heatsinks', [.5, .45]]] }),
      b('How long is the list? Anthropic doesn’t publish Claude’s size, so take a public example: GPT-3 used 12,288 numbers for every token.', { photo: 'h100s', focus: [.5, .5, 1.3], cue: 'embed', p0: .5, p1: 1, stat: ['12,288', 'numbers per token in GPT-3', 'gpt3'] }),
      b('Words with similar meanings end up with similar lists, like neighbouring houses on a map. Position is mixed in too, so “dog bites man” differs from “man bites dog”.', { photo: 'campus-aerial', cue: 'embed', p0: 1 }),
      b('The original Transformer added each token’s position as waves of different lengths. Newer models use other tricks, but the point is the same: word order matters.', { photo: 'campus-aerial', focus: [.5, .5, 1.25], src: 'transformer' })
    ] },
  { id: 'ch5', title: 'A tall stack of layers', sub: 'The Transformer', where: 'The AI chips',
    beats: [
      b('Almost every chat AI today is a Transformer, a design published by Google researchers in 2017. It is a tall stack of identical layers.', { photo: 'bluegene-hall', cue: 'stack', p0: 0, p1: .4, src: 'transformer' }),
      b('GPT-3, for example, has 96 layers and 175 billion parameters: the numbers it learned in training. Every layer reads all the token lists and adds a little understanding.', { photo: 'ai-rack', cue: 'stack', p0: .4, p1: .8, stat: ['175 billion', 'parameters in GPT-3, across 96 layers', 'gpt3'] }),
      b('Each layer has two parts: attention, where tokens look at each other, and a feed-forward network, where each token is worked on alone. Then on to the next layer.', { photo: 'rack-servers', cue: 'stack', p0: .8, p1: 1 }),
      b('Each layer adds its result back onto what came in, a “residual connection”, so information can flow straight up through all the layers without getting lost.', { photo: 'rack-servers', focus: [.5, .4, 1.25], src: 'transformer' }),
      b('The feed-forward part is wide. In GPT-3 it stretches each token’s 12,288 numbers out to 49,152 and back again, and it holds about two-thirds of the parameters.', { photo: 'rack-servers', focus: [.5, .6, 1.2], stat: ['49,152', 'numbers inside each feed-forward step (GPT-3)', 'gpt3'] }),
      b('Training set those parameters by reading huge amounts of text and practising one thing: guessing the next token. Issue 03 tells that story. Here, they are fixed.', { photo: 'library' })
    ] },
  { id: 'ch6', title: 'Attention', sub: 'Every token looks back', where: 'The AI chips',
    beats: [
      b('In “The animal didn’t cross the street because it was too tired”, what is “it”? To know, the model must look back at the other words. That is attention.', { photo: 'atc', cue: 'attn', p0: 0, p1: .35, try: 'attn' }),
      b('Each token makes three small lists: a query (“what am I looking for?”), a key (“what do I contain?”) and a value (“what I can pass on”).', { photo: 'atc', focus: [.4, .5, 1.3], cue: 'qkv', try: 'attn' }),
      b('A token’s query is compared with every earlier key. Good matches get more weight, and the token takes a weighted mix of their values. “It” draws mostly on “animal”.', { photo: 'atc', focus: [.6, .5, 1.3], cue: 'attn', p0: .35, p1: 1, try: 'attn' }),
      b('The match scores are scaled and turned into shares that add up to 100% (a “softmax”), and those shares decide how much of each value is mixed in.', { photo: 'atc', focus: [.5, .45, 1.15], src: 'transformer', try: 'attn' }),
      b('Many attention “heads” do this side by side, each tracking something different: grammar, names, what came before. GPT-3 had 96 heads in every layer.', { photo: 'atc', stat: ['96', 'attention heads per layer in GPT-3', 'gpt3'] }),
      b('A chat model only looks backwards: a token can see earlier tokens, never later ones. That is what lets it write left to right, one token at a time.', { photo: 'rail-yard', cue: 'mask' }),
      b('Attention has a cost: every token compares itself with every earlier one, so the work grows with the square of the length. Twice the conversation means about four times the attention work.', { photo: 'rail-yard', focus: [.6, .5, 1.2], src: 'transformer' })
    ] },
  { id: 'ch7', title: 'It is all multiplication', sub: 'Grids of numbers', where: 'The AI chips',
    beats: [
      b('Under the words, it is arithmetic. Making queries, keys and values, mixing them, and the feed-forward step are all matrix multiplications: grids of numbers times grids of numbers.', { photo: 'code', cue: 'matmul', p0: 0, p1: .5, try: 'chip' }),
      b('Each parameter is used about twice per token: one multiply and one add. So a model with 175 billion parameters does about 350 billion operations for every token.', { photo: 'code', focus: [.6, .5, 1.3], cue: 'matmul', p0: .5, p1: 1, src: 'kaplan', stat: ['≈ 2', 'operations per parameter, per token', 'kaplan'], try: 'chip' }),
      b('Where are those parameters? In each GPT-3 layer: four 12,288-by-12,288 grids for attention and two 12,288-by-49,152 grids for the feed-forward. That is about 1.8 billion, times 96 layers.', { photo: 'code', focus: [.4, .5, 1.25], cue: 'layerparams', try: 'chip' }),
      b('A few hundred words of answer means hundreds of tokens. That is far more arithmetic than a phone could do quickly, which is why it runs on special chips.', { photo: 'tsubame-node', try: 'chip' })
    ] },
  { id: 'ch8', title: 'Inside the chip', sub: 'Thousands of tiny calculators', where: 'GPU or TPU, in a server',
    beats: [
      b('A regular processor has a few big, clever cores. An AI chip has thousands of small ones built for one job: multiplying grids of numbers, all at once.', { photo: 'wafer', cue: 'cores', try: 'chip' }),
      b('NVIDIA GPUs have “tensor cores” that each multiply small blocks of numbers in one step. Google’s TPU uses a “systolic array”, where numbers pulse through a grid of multipliers.', { photo: 'tpu-board', src: 'tpu', cue: 'systolic', try: 'chip', plabels: [['AI chips under cold plates', [.42, .38]], ['Liquid cooling pipes', [.6, .58]]] }),
      b('One NVIDIA H100 is rated at about 1,979 trillion 16-bit operations a second, using a sparsity trick. Anthropic says it runs Claude on NVIDIA GPUs, Google TPUs and AWS Trainium.', { photo: 'h100s', stat: ['1,979', 'trillion 16-bit operations a second, H100 (with sparsity)', 'h100'], src: 'anthropic', try: 'chip' }),
      b('Smaller numbers go faster. With 8-bit numbers (FP8) an H100 is rated at about 3,958 trillion operations a second, double its 16-bit figure.', { photo: 'h100s', focus: [.55, .5, 1.2], stat: ['3,958', 'trillion 8-bit operations a second, H100 (with sparsity)', 'h100'], try: 'chip' }),
      b('They are hungry: an H100 can draw up to 700 watts, as much as seven old 100-watt light bulbs, and gets cooled by air or liquid. Issue 01 shows the racks and the cooling.', { photo: 'tpu-board', focus: [.45, .45, 1.3], stat: ['700 W', 'maximum power of one H100', 'h100'] })
    ] },
  { id: 'ch9', title: 'Memory is the bottleneck', sub: 'HBM: stacks of memory beside the chip', where: 'Right next to the AI chip',
    beats: [
      b('The parameters must sit in memory right next to the chip. AI chips use High Bandwidth Memory: memory dies stacked like a tower, wired straight down through the silicon.', { photo: 'tsubame-node', src: 'hbm', cue: 'hbm' }),
      b('An H100 has 80 GB of it, readable at 3.35 terabytes a second: over 3 gigabytes every thousandth of a second.', { photo: 'tsubame-node', focus: [.5, .5, 1.3], stat: ['3.35 TB/s', 'memory speed of one H100 (80 GB)', 'h100'], try: 'chip' }),
      b('Here is the catch. To write each new token, the chip must read every parameter once. With 16-bit numbers, 175 billion parameters are 350 GB: more than four H100s can even hold.', { photo: 'h100s', cue: 'membw', p0: 0, p1: .5, try: 'chip' }),
      b('So writing one answer token is usually limited by how fast memory can be read, not by the arithmetic. That single fact shapes almost every speed trick you will meet.', { photo: 'h100s', focus: [.4, .5, 1.25], cue: 'membw', p0: .5, p1: 1, try: 'chip' }),
      b('The KV cache you’ll meet soon takes memory too. If a model were built like GPT-3 with 16-bit numbers, each token would need 2 × 96 layers × 12,288 numbers × 2 bytes: about 4.7 MB.', { photo: 'tsubame-node', focus: [.4, .5, 1.2], cue: 'kvsize' }),
      b('So GPT-3’s 2,048-token window would need nearly 10 GB of cache for one conversation. Long conversations really do fill up a chip’s memory.', { photo: 'tsubame-node', focus: [.6, .5, 1.25], cue: 'kvsize', p0: 1 })
    ] },
  { id: 'ch10', title: 'Many chips, one model', sub: 'Splitting the work', where: 'A rack of AI servers',
    beats: [
      b('A big model doesn’t fit on one chip, so it is split. Each chip holds a slice of every layer and does its part of every multiplication: tensor parallelism.', { photo: 'ai-rack', cue: 'split', p0: 0, p1: .5 }),
      b('Or the layers are shared out in order, like an assembly line, each group of chips passing its results to the next: pipeline parallelism.', { photo: 'containers', cue: 'split', p0: .5, p1: 1 }),
      b('The work is also split by people: different groups of chips serve different conversations at the same time, each holding its own copy of the model.', { photo: 'wmf-racks', focus: [.5, .5, 1.2] }),
      b('Split chips must talk constantly. H100s link to each other at 900 GB/s over NVLink, many times faster than an ordinary network.', { photo: 'cabling', stat: ['900 GB/s', 'NVLink between H100 GPUs', 'h100'] }),
      b('The newest racks join 72 GPUs into one giant unit, drawing about 132–140 kW and cooled by liquid, as Issue 01 showed.', { photo: 'ai-rack', focus: [.5, .4, 1.15], stat: ['72', 'GPUs in one liquid-cooled rack', 'nvl72'] })
    ] },
  { id: 'ch11', title: 'Reading, then writing', sub: 'Prefill and decode', where: 'The AI chips',
    beats: [
      b('An answer happens in two phases. First the model reads your whole conversation at once, all tokens in parallel. This is called prefill, and the chips are busy doing maths.', { photo: 'wmf-racks', cue: 'phases', p0: 0, p1: .45 }),
      b('Then it writes, one token at a time: decode. Each new token needs a full pass through every layer, and that pass waits on memory.', { photo: 'wmf-racks', focus: [.6, .5, 1.25], cue: 'phases', p0: .45, p1: 1 }),
      b('That gives two speeds you can feel: the wait for the first word (mostly prefill, longer for a long prompt) and then how fast words flow (decode).', { photo: 'typing', focus: [.5, .45, 1.15], cue: 'phases', p0: 1 }),
      b('To avoid redoing old work, each layer keeps every earlier token’s keys and values in memory: the KV cache. A new token only computes its own and looks back at the cache.', { photo: 'blue-racks', cue: 'kv', p0: 0, p1: 1, src: 'kvcache' }),
      b('The cache grows with every token, so very long conversations use a lot of memory. Today’s Claude models can take in up to about a million tokens.', { photo: 'library', stat: ['1 million', 'tokens of context, today’s Claude models', 'models'] }),
      b('For comparison, GPT-3 in 2020 could look back over just 2,048 tokens: a few pages.', { photo: 'eniac', stat: ['2,048', 'tokens of context in GPT-3 (2020)', 'gpt3'] })
    ] },
  { id: 'ch12', title: 'Choosing the next word', sub: 'Probabilities and sampling', where: 'The AI chips',
    beats: [
      b('After the last layer, the model gives a score to every token in its vocabulary. Turned into probabilities, they say how likely each one is to come next.', { photo: 'coins', cue: 'probs', p0: 0, p1: .4, try: 'next' }),
      b('A softmax turns the scores into probabilities: each score becomes a positive number, and they are all scaled to add up to 100%. Higher scores win by a lot.', { photo: 'coins', focus: [.5, .55, 1.15], cue: 'probs', p0: .4, try: 'next' }),
      b('Then one is picked. Always taking the top one sounds safe but gets dull and repetitive, so usually it picks at random, weighted by those probabilities.', { photo: 'coins', focus: [.45, .5, 1.3], cue: 'probs', p0: .4, p1: .7, try: 'next' }),
      b('A setting called temperature sharpens or flattens the odds: low for steady, factual answers, high for variety. Top-p keeps only the likeliest few, so odd words are skipped.', { photo: 'coins', focus: [.55, .45, 1.2], cue: 'probs', p0: .7, p1: 1, src: 'nucleus', try: 'next' }),
      b('The chosen token is added to the conversation, and the whole stack runs again to choose the next one. That loop repeats until the answer is finished.', { photo: 'rail-yard', cue: 'loop', try: 'next' })
    ] },
  { id: 'ch13', title: 'Back to your screen', sub: 'Streaming, token by token', where: 'The internet, and your device',
    beats: [
      b('You don’t wait for the whole answer. Each token is turned back into text and sent the moment it is chosen, as a stream of small messages called server-sent events.', { photo: 'fibre', cue: 'stream', p0: 0, p1: 1, src: 'stream' }),
      b('Turning tokens back into text is easy: each number is looked up in the vocabulary again, and pieces of a split word simply join back up.', { photo: 'catalog', focus: [.5, .5, 1.3], cue: 'stream', p0: .5 }),
      b('That is why words appear one after another. The speed you see is the decode loop running, minus a little time for the trip back to you.', { photo: 'typing', focus: [.5, .5, 1.2], cue: 'stream', p0: 1 }),
      b('When the model writes its “end” token, or reaches the length limit, the stream closes. Your app keeps the answer, ready to send along with your next question.', { photo: 'code' })
    ] },
  { id: 'ch14', title: 'Making it fast', sub: 'The tricks that make it fast', where: 'The serving software',
    beats: [
      b('Batching: since every token must read all the parameters anyway, the chips handle many people’s conversations in the same pass. One read, many answers.', { photo: 'containers', cue: 'batch' }),
      b('Batching trades a little waiting for a lot more work done: one read of the weights serves many conversations, so each person’s token costs far less.', { photo: 'containers', focus: [.55, .5, 1.2], cue: 'batch' }),
      b('FlashAttention reorders the attention maths so it reads and writes memory far less, which makes it faster with exactly the same result.', { photo: 'pitstop', src: 'flash' }),
      b('Speculative decoding: a small, quick model guesses several tokens ahead, and the big model checks them all in one pass. Its paper shows the output doesn’t change.', { photo: 'pilots', cue: 'spec', src: 'specdec' }),
      b('Quantization stores numbers with fewer bits, 8 or even 4 instead of 16. The model takes less memory and reads faster, at a small cost in precision.', { photo: 'inside-server', cue: 'quant', try: 'chip' }),
      b('Prompt caching keeps the KV cache of a long shared beginning, such as a document you keep asking about, so it isn’t read from scratch each time.', { photo: 'catalog' }),
      b('Big services run many copies of the model across many racks, and the scheduler from chapter 2 spreads conversations between them to keep every chip busy.', { photo: 'campus-aerial' })
    ] },
  { id: 'ch15', title: 'What it costs', sub: 'Energy, water and limits', where: 'The data center',
    beats: [
      b('Every answer uses electricity and cooling. Google measured a median Gemini text prompt at 0.24 Wh of energy and 0.26 ml of water: about five drops.', { photo: 'towers', stat: ['0.24 Wh', 'per median Gemini text prompt (Google, 2025)', 'gemini'] }),
      b('Longer conversations, longer answers and bigger models cost more: more tokens to read, more passes to write. That is why services count and price tokens.', { photo: 'coins' }),
      b('And the model only predicts likely text. It can sound sure and still be wrong, so check what matters, and ask it for sources.', { photo: 'technician' })
    ] },
  { id: 'ch16', title: 'Journey’s end', sub: 'One message, end to end', where: 'Everywhere',
    beats: [
      b('Your message: encrypted across the internet, split into tokens, turned into lists of numbers, passed through layer after layer of attention and multiplication.', { photo: 'cern-hall', cue: 'recap', p0: 0, p1: .5 }),
      b('Spread across many chips, limited by how fast their memory can be read, then a probability, a pick, and a token streamed back, again and again until it’s done.', { photo: 'ai-rack', cue: 'recap', p0: .5, p1: 1 }),
      b('Next time words flow into your chat, picture the racks of chips and the stacks of memory, writing your answer one token at a time.', { photo: 'blue-racks' })
    ] }
];

export const RECAPS = {
  ch1: ['Your message goes to a data center; the answer is written there and streamed back.'],
  ch2: ['The request carries the whole conversation; the model has no memory between requests.'],
  ch3: ['A tokenizer cuts text into tokens (about 3.5 English characters each on earlier Claude models).', 'Each token is a number in a fixed vocabulary.'],
  ch4: ['Each token becomes a long list of numbers, its embedding (12,288 numbers in GPT-3).'],
  ch5: ['A Transformer is a stack of layers: attention, then a feed-forward network.', 'GPT-3: 96 layers, 175 billion parameters.'],
  ch6: ['Attention lets each token look back at earlier ones using queries, keys and values.', 'Many heads work side by side; tokens never see the future.'],
  ch7: ['It is all matrix multiplication: about 2 operations per parameter per token.'],
  ch8: ['AI chips have thousands of small cores built for multiplying grids of numbers.', 'An H100: up to 700 W.'],
  ch9: ['Parameters live in HBM beside the chip; writing each token means reading them all.', 'So decoding is usually limited by memory speed.'],
  ch10: ['Big models are split across many chips (tensor and pipeline parallelism) linked by fast connections.'],
  ch11: ['Prefill reads the prompt in parallel; decode writes one token at a time.', 'The KV cache saves earlier work and grows with the conversation.'],
  ch12: ['Scores become probabilities; one token is sampled; temperature and top-p shape the choice.', 'Then the loop repeats.'],
  ch13: ['Tokens stream back as they are chosen (server-sent events).'],
  ch14: ['Batching, FlashAttention, speculative decoding, quantization and caching make it fast.'],
  ch15: ['Each answer costs energy and water; longer means more; check what matters.'],
  ch16: ['One message, end to end: tokens, layers, chips, memory, sampling, streaming.']
};

/* Real photos (filled in by the photo build): Wikimedia Commons, free licences, credited. */
export const PHOTOS = [
  {"id":"typing","file":"photos/typing.jpg","thumb":"photos/thumbs/typing.jpg","w":1400,"h":788,"title":"Typing on a backlit keyboard","alt":"Hands typing on a dark laptop keyboard with glowing keys","fit":"cover","author":"Colin","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0/","url":"https://commons.wikimedia.org/wiki/File:Backlit_keyboard.jpg"},
  {"id":"cern-hall","file":"photos/cern-hall.jpg","thumb":"photos/thumbs/cern-hall.jpg","w":1280,"h":853,"title":"A server hall at CERN, Geneva","alt":"Rows of server cabinets in a big, brightly lit hall","fit":"cover","author":"Florian Hirzinger - www.fh-ap.com","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:CERN_Server_03.jpg"},
  {"id":"code","file":"photos/code.jpg","thumb":"photos/thumbs/code.jpg","w":1280,"h":853,"title":"Code on a screen: software watching the machines","alt":"Lines of program code on a computer monitor","fit":"cover","author":"Markus Spiske markusspiske","licence":"CC0","licUrl":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","url":"https://commons.wikimedia.org/wiki/File:Code_on_computer_monitor_(Unsplash).jpg"},
  {"id":"wmf-racks","file":"photos/wmf-racks.jpg","thumb":"photos/thumbs/wmf-racks.jpg","w":1400,"h":933,"title":"Server racks at the Wikimedia Foundation","alt":"Tall black racks packed with servers, their front lights glowing","fit":"cover","author":"Victor Grigas","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_35.jpg"},
  {"id":"fibre","file":"photos/fibre.jpg","thumb":"photos/thumbs/fibre.jpg","w":1400,"h":877,"title":"Optical fibre carrying light","alt":"A coil of optical fibre glowing red where light enters and leaves","fit":"cover","author":"Hustvedt","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Fiber_optic_illuminated.jpg"},
  {"id":"switches","file":"photos/switches.jpg","thumb":"photos/thumbs/switches.jpg","w":1280,"h":851,"title":"Network switches and their cables","alt":"Grey and blue network cables plugged into the ports of network switches","fit":"cover","author":"ShakataGaNai","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Network_switches.jpg"},
  {"id":"library","file":"photos/library.jpg","thumb":"photos/thumbs/library.jpg","w":1400,"h":934,"title":"The Library of Congress reading room","alt":"A grand circular reading room with desks and arched windows","fit":"cover","author":"Carol M. Highsmith","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:LOC_Main_Reading_Room_Highsmith.jpg"},
  {"id":"catalog","file":"photos/catalog.jpg","thumb":"photos/thumbs/catalog.jpg","w":1280,"h":853,"title":"A library card catalogue: an index for finding things","alt":"A wooden drawer full of library index cards","fit":"cover","author":"Michael Holley Swtpc6800","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:Copyright_Card_Catalog_Drawer.jpg"},
  {"id":"h100s","file":"photos/h100s.jpg","thumb":"photos/thumbs/h100s.jpg","w":1280,"h":961,"title":"Four GPUs inside a server node (TSUBAME 4.0)","alt":"Four GPU modules under heatsinks inside an open server","fit":"cover","author":"Fukumoto","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:TSUBAME4.0_P5160984.jpg"},
  {"id":"campus-aerial","file":"photos/campus-aerial.jpg","thumb":"photos/thumbs/campus-aerial.jpg","w":1280,"h":647,"title":"A data center campus from the air (Mayes County, Oklahoma)","alt":"Aerial view of large data-center buildings surrounded by farmland","fit":"cover","author":"Xpda","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Google_Mayes_County_P0004974a.jpg"},
  {"id":"bluegene-hall","file":"photos/bluegene-hall.jpg","thumb":"photos/thumbs/bluegene-hall.jpg","w":1400,"h":928,"title":"A supercomputer hall (IBM Blue Gene/P, Argonne)","alt":"Rows of black supercomputer cabinets in a white hall","fit":"cover","author":"Argonne National Laboratory","licence":"CC BY-SA 2.0","licUrl":"https://creativecommons.org/licenses/by-sa/2.0","url":"https://commons.wikimedia.org/wiki/File:IBM_Blue_Gene_P_supercomputer.jpg"},
  {"id":"ai-rack","file":"photos/ai-rack.jpg","thumb":"photos/thumbs/ai-rack.jpg","w":487,"h":1400,"title":"A rack-scale AI system (NVIDIA GB200 NVL72)","alt":"A tall cabinet filled with stacked GPU compute trays","fit":"contain","author":"Pokiiri","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Nvidia_DGX_GB200.jpg"},
  {"id":"rack-servers","file":"photos/rack-servers.jpg","thumb":"photos/thumbs/rack-servers.jpg","w":1280,"h":1219,"title":"Rack servers (Wikimedia Foundation)","alt":"Rack servers stacked from floor to ceiling","fit":"contain","author":"Victor Grigas","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_08.jpg"},
  {"id":"atc","file":"photos/atc.jpg","thumb":"photos/thumbs/atc.jpg","w":1400,"h":931,"title":"Air traffic control: directing traffic","alt":"A controller at radar screens, directing aircraft","fit":"cover","author":"Senior Airman John Wright","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:Lajes_Field_Air_Traffic_Control.jpg"},
  {"id":"rail-yard","file":"photos/rail-yard.jpg","thumb":"photos/thumbs/rail-yard.jpg","w":1400,"h":933,"title":"A railway switching yard: choosing the next track","alt":"A freight train in a rail yard with several tracks and switches","fit":"cover","author":"4300streetcar","licence":"CC BY 4.0","licUrl":"https://creativecommons.org/licenses/by/4.0","url":"https://commons.wikimedia.org/wiki/File:CSX_train_switching_at_Framingham_North_Yard_June_2026.jpg"},
  {"id":"tsubame-node","file":"photos/tsubame-node.jpg","thumb":"photos/thumbs/tsubame-node.jpg","w":1280,"h":961,"title":"A supercomputer node (TSUBAME 4.0)","alt":"A computing node in a clear case on a display stand","fit":"cover","author":"Fukumoto","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:TSUBAME4.0_P5160989.jpg"},
  {"id":"wafer","file":"photos/wafer.jpg","thumb":"photos/thumbs/wafer.jpg","w":1400,"h":932,"title":"A silicon wafer full of chips","alt":"A shiny silicon wafer covered in a grid of chips, reflecting rainbow colours","fit":"cover","author":"Enrique Jiménez","licence":"CC BY-SA 2.0","licUrl":"https://creativecommons.org/licenses/by-sa/2.0","url":"https://commons.wikimedia.org/wiki/File:Silicon_Wafer_20190210.jpg"},
  {"id":"tpu-board","file":"photos/tpu-board.jpg","thumb":"photos/thumbs/tpu-board.jpg","w":1280,"h":913,"title":"A liquid-cooled AI chip board (Google TPU v3)","alt":"A circuit board with four chips under copper cold plates joined by liquid pipes","fit":"cover","author":"Zinskauf","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Tensor_Processing_Unit_3.0.jpg"},
  {"id":"containers","file":"photos/containers.jpg","thumb":"photos/thumbs/containers.jpg","w":1400,"h":1050,"title":"Container cranes: goods packed into standard boxes","alt":"Red container cranes at a port, with stacks of shipping containers","fit":"cover","author":"Calistemon","licence":"CC BY-SA 4.0","licUrl":"https://creativecommons.org/licenses/by-sa/4.0","url":"https://commons.wikimedia.org/wiki/File:Container_cranes_in_Fremantle_Harbour,_July_2023_01.jpg"},
  {"id":"cabling","file":"photos/cabling.jpg","thumb":"photos/thumbs/cabling.jpg","w":1280,"h":853,"title":"Network cabling in a data center","alt":"Blue and green network cables plugged into rows of servers","fit":"cover","author":"Victor Grigas","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:Wikimedia_Foundation_Servers-8055_24.jpg"},
  {"id":"blue-racks","file":"photos/blue-racks.jpg","thumb":"photos/thumbs/blue-racks.jpg","w":1400,"h":930,"title":"Racks full of servers","alt":"Rows of servers in tall racks, lit blue","fit":"cover","author":"BalticServers.com","licence":"CC BY-SA 3.0","licUrl":"https://creativecommons.org/licenses/by-sa/3.0","url":"https://commons.wikimedia.org/wiki/File:BalticServers_data_center.jpg"},
  {"id":"eniac","file":"photos/eniac.jpg","thumb":"photos/thumbs/eniac.jpg","w":1340,"h":1024,"title":"ENIAC, one of the first big computers (1940s)","alt":"A black-and-white photo of two programmers at the tall panels of the ENIAC computer, which fills a long room","fit":"cover","author":"U.S. Army (photographer unknown)","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:Glen_Beck_and_Betty_Snyder_program_the_ENIAC_in_building_328_at_the_Ballistic_Research_Laboratory.jpg"},
  {"id":"coins","file":"photos/coins.jpg","thumb":"photos/thumbs/coins.jpg","w":1400,"h":1050,"title":"Coins: every payment is a small piece of data","alt":"A pile of coins on a table","fit":"cover","author":"Роман Рябенко","licence":"CC0","licUrl":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","url":"https://commons.wikimedia.org/wiki/File:A_pile_of_Ukrainian_currency_coins.jpg"},
  {"id":"pitstop","file":"photos/pitstop.jpg","thumb":"photos/thumbs/pitstop.jpg","w":1400,"h":749,"title":"A Formula One wheel gun: spares changed in seconds","alt":"A red pneumatic wheel gun used in Formula One pit stops","fit":"cover","author":"Rich Jones from United Kingdom","licence":"CC BY 2.0","licUrl":"https://creativecommons.org/licenses/by/2.0","url":"https://commons.wikimedia.org/wiki/File:Formula_One_Wheel_Gun.jpg"},
  {"id":"pilots","file":"photos/pilots.jpg","thumb":"photos/thumbs/pilots.jpg","w":1400,"h":927,"title":"Pilots working through a checklist","alt":"Two pilots in a cockpit at night, lit by instrument panels","fit":"cover","author":"U.S. Air Force photo/Staff Sgt. Chris Willis","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:120316-F-LR266-986_C-130J_Hercules_Cockpit_Ramstein_Air_Base_2012.jpg"},
  {"id":"inside-server","file":"photos/inside-server.jpg","thumb":"photos/thumbs/inside-server.jpg","w":1280,"h":853,"title":"Inside a 1U server, lid off","alt":"A thin rack server with its lid removed: fans, heatsinks, memory and drives","fit":"cover","author":"Rodzilla at English Wikipedia","licence":"CC BY 2.5","licUrl":"https://creativecommons.org/licenses/by/2.5","url":"https://commons.wikimedia.org/wiki/File:Inside_and_Rear_of_Webserver.jpg"},
  {"id":"towers","file":"photos/towers.jpg","thumb":"photos/thumbs/towers.jpg","w":1280,"h":960,"title":"Cooling towers on a data center (Mesa, Arizona)","alt":"Rows of cooling-tower fans on a data-center roof","fit":"cover","author":"Rsparks3","licence":"CC0","licUrl":"https://creativecommons.org/publicdomain/zero/1.0/deed.en","url":"https://commons.wikimedia.org/wiki/File:Data_center_cooling_tower.jpg"},
  {"id":"technician","file":"photos/technician.jpg","thumb":"photos/thumbs/technician.jpg","w":1280,"h":834,"title":"A technician at work on network equipment","alt":"A technician in a blue shirt working on equipment in a rack","fit":"cover","author":"Bill Branson (Photographer)","licence":"Public domain","licUrl":"","url":"https://commons.wikimedia.org/wiki/File:Network_server_and_technician.jpg"}
];
