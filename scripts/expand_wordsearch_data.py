#!/usr/bin/env python3
"""Expand data/family-word-games.json wordSearch bank:
10 categories x 3 difficulties x 12 words, each with a kid-friendly hint.
Preserves the existing 'spelling' section. json.dump = escape-safe."""
import json

D = {}  # (category, difficulty) -> [(WORD, hint), ...]

D[("animals", "easy")] = [
    ("CAT", "A pet that meows"), ("DOG", "A loyal pet that barks"),
    ("COW", "Gives us milk"), ("PIG", "A farm animal that oinks"),
    ("FOX", "A clever orange animal"), ("BEAR", "A big animal that loves honey"),
    ("LION", "King of the jungle"), ("FISH", "It swims and has fins"),
    ("DUCK", "A bird that says quack"), ("GOAT", "A farm animal with horns"),
    ("FROG", "A green jumper that says ribbit"), ("WOLF", "A wild animal that howls"),
]
D[("animals", "medium")] = [
    ("RABBIT", "It hops and loves carrots"), ("MONKEY", "It swings from trees"),
    ("GIRAFFE", "The tallest animal"), ("DOLPHIN", "A smart, friendly sea animal"),
    ("PENGUIN", "A bird that cannot fly but swims"), ("LEOPARD", "A spotted big cat"),
    ("OSTRICH", "The biggest bird of all"), ("HAMSTER", "A tiny pet with puffy cheeks"),
    ("TORTOISE", "A slow animal with a shell"), ("PANTHER", "A black big cat"),
    ("PEACOCK", "A bird with a beautiful tail"), ("DONKEY", "A farm animal that brays"),
]
D[("animals", "hard")] = [
    ("ELEPHANT", "The biggest land animal"), ("KANGAROO", "It carries babies in a pouch"),
    ("CROCODILE", "A long reptile with sharp teeth"), ("RHINOCEROS", "A heavy animal with a horn"),
    ("CHIMPANZEE", "A smart ape"), ("FLAMINGO", "A pink bird on one leg"),
    ("PORCUPINE", "Covered in sharp quills"), ("ARMADILLO", "It rolls into an armored ball"),
    ("SALAMANDER", "A small amphibian"), ("MONGOOSE", "A snake-fighting mammal"),
    ("HEDGEHOG", "A small spiky animal"), ("ANTELOPE", "A fast horned runner"),
]
D[("food", "easy")] = [
    ("RICE", "Small white grains"), ("MILK", "A white drink from cows"),
    ("EGG", "It comes from a hen"), ("CAKE", "A sweet birthday treat"),
    ("SOUP", "A warm bowl you sip"), ("BREAD", "Made from flour, great for toast"),
    ("APPLE", "A crunchy red or green fruit"), ("MANGO", "A sweet yellow tropical fruit"),
    ("PIZZA", "A cheesy slice from Italy"), ("CORN", "Yellow kernels on a cob"),
    ("BEAN", "A small seed you can eat"), ("TACO", "A folded Mexican treat"),
]
D[("food", "medium")] = [
    ("BANANA", "A long yellow fruit"), ("ORANGE", "A citrus fruit and a color"),
    ("CARROT", "An orange vegetable rabbits love"), ("TOMATO", "Red and juicy, used in salad"),
    ("NOODLES", "Long strands you slurp"), ("BURGER", "A patty inside a bun"),
    ("YOGURT", "A creamy dairy snack"), ("CHEESE", "Made from milk, mice love it"),
    ("PANCAKE", "A flat breakfast treat with syrup"), ("BISCUIT", "A crunchy tea-time snack"),
    ("COCONUT", "A hairy fruit with water inside"), ("PAPAYA", "An orange tropical fruit"),
]
D[("food", "hard")] = [
    ("SPAGHETTI", "Long Italian pasta"), ("CHOCOLATE", "A sweet brown treat"),
    ("SANDWICH", "Fillings between bread slices"), ("PINEAPPLE", "A spiky tropical fruit"),
    ("STRAWBERRY", "A red berry with seeds outside"), ("WATERMELON", "A big green fruit, red inside"),
    ("BLUEBERRY", "A tiny round blue fruit"), ("AVOCADO", "A green fruit for guacamole"),
    ("BROCCOLI", "A green vegetable like a tiny tree"), ("CUCUMBER", "A cool green salad vegetable"),
    ("DUMPLING", "A little dough pocket"), ("OMELETTE", "Beaten eggs cooked flat"),
]
D[("school", "easy")] = [
    ("PEN", "You write in ink with it"), ("BOOK", "Pages full of stories"),
    ("DESK", "You sit and work at it"), ("RULER", "It measures and draws straight lines"),
    ("CHALK", "It writes on a blackboard"), ("GLUE", "It sticks things together"),
    ("BAG", "You carry books in it"), ("MATH", "The subject with numbers"),
    ("CLASS", "A room full of students"), ("TEST", "A quiz of what you learned"),
    ("QUIZ", "A short test"), ("NOTE", "A short written message"),
]
D[("school", "medium")] = [
    ("PENCIL", "Write and erase with it"), ("ERASER", "It removes pencil marks"),
    ("CRAYON", "A waxy coloring stick"), ("TEACHER", "The person who helps you learn"),
    ("STUDENT", "A person who learns"), ("LIBRARY", "A quiet room full of books"),
    ("SCIENCE", "The subject with experiments"), ("HISTORY", "The subject about the past"),
    ("RECESS", "Playtime between lessons"), ("LOCKER", "A small cupboard for your things"),
    ("MARKER", "A thick colorful pen"), ("FOLDER", "It keeps papers tidy"),
]
D[("school", "hard")] = [
    ("NOTEBOOK", "You write your lessons in it"), ("HOMEWORK", "School tasks done at home"),
    ("CLASSROOM", "The room where lessons happen"), ("DICTIONARY", "A book full of word meanings"),
    ("GEOGRAPHY", "The subject about maps and places"), ("CALCULATOR", "A machine that does math"),
    ("BACKPACK", "You wear it full of books"), ("SCISSORS", "They cut paper"),
    ("PRINCIPAL", "The leader of the school"), ("ASSEMBLY", "When the whole school gathers"),
    ("UNIFORM", "Matching school clothes"), ("TIMETABLE", "Your schedule of classes"),
]
D[("nature", "easy")] = [
    ("TREE", "Tall plant with leaves and bark"), ("LEAF", "It grows green on branches"),
    ("ROCK", "A hard piece of stone"), ("RAIN", "Water falling from clouds"),
    ("SNOW", "Cold white flakes"), ("WIND", "Moving air you can feel"),
    ("STAR", "It twinkles at night"), ("MOON", "It glows in the night sky"),
    ("LAKE", "A big pool of fresh water"), ("HILL", "A small mountain"),
    ("SEED", "A plant starts from this"), ("ROSE", "A flower with thorns"),
]
D[("nature", "medium")] = [
    ("FLOWER", "The colorful part of a plant"), ("FOREST", "A place full of trees"),
    ("RIVER", "Water flowing to the sea"), ("GARDEN", "Where flowers are planted"),
    ("ISLAND", "Land surrounded by water"), ("DESERT", "A hot sandy place"),
    ("VALLEY", "Low land between mountains"), ("MEADOW", "A grassy open field"),
    ("SUNSET", "When the sun goes down"), ("BREEZE", "A soft gentle wind"),
    ("PEBBLE", "A small smooth stone"), ("SPRING", "The season of new flowers"),
]
D[("nature", "hard")] = [
    ("MOUNTAIN", "A very tall rocky peak"), ("RAINBOW", "Colors in the sky after rain"),
    ("WATERFALL", "Water falling off a cliff"), ("VOLCANO", "A mountain that erupts"),
    ("GLACIER", "A slow river of ice"), ("HURRICANE", "A giant spinning storm"),
    ("BUTTERFLY", "A colorful insect with wings"), ("SUNFLOWER", "A tall yellow flower"),
    ("EVERGREEN", "A tree that stays green all year"), ("WILDERNESS", "Wild untouched nature"),
    ("LANDSCAPE", "A wide view of nature"), ("HORIZON", "Where sky meets land"),
]
D[("family", "easy")] = [
    ("MOM", "She loves and cares for you"), ("DAD", "Your father"),
    ("BABY", "The youngest family member"), ("AUNT", "Your parent's sister"),
    ("SON", "A parent's boy"), ("HOME", "Where the family lives"),
    ("LOVE", "What families share"), ("HUG", "A warm squeeze"),
    ("PLAY", "What kids do for fun"), ("MEAL", "Food shared together"),
    ("GIFT", "A wrapped surprise"), ("TRIP", "A family journey"),
]
D[("family", "medium")] = [
    ("MOTHER", "Another word for mom"), ("FATHER", "Another word for dad"),
    ("SISTER", "A girl with the same parents"), ("BROTHER", "A boy with the same parents"),
    ("COUSIN", "Your aunt's child"), ("UNCLE", "Your parent's brother"),
    ("FRIEND", "Someone you love to play with"), ("PARENT", "A mom or a dad"),
    ("WEDDING", "When two people marry"), ("PICNIC", "A meal outdoors"),
    ("VISIT", "Going to see someone"), ("STORY", "What grandparents tell at night"),
]
D[("family", "hard")] = [
    ("GRANDMOTHER", "Your parent's mother"), ("GRANDFATHER", "Your parent's father"),
    ("DAUGHTER", "A parent's girl"), ("RELATIVES", "All the people in your family"),
    ("TOGETHER", "How families do things"), ("BIRTHDAY", "Your special yearly day"),
    ("CELEBRATION", "A happy family event"), ("TRADITION", "Something families always do"),
    ("HOUSEHOLD", "Everyone living in one home"), ("MEMORIES", "Special moments you remember"),
    ("REUNION", "When the whole family meets"), ("KINDNESS", "Being gentle and caring"),
]
D[("colors", "easy")] = [
    ("RED", "The color of tomatoes"), ("BLUE", "The color of the sky"),
    ("PINK", "A light shade of red"), ("GOLD", "The color of treasure"),
    ("GRAY", "The color of rain clouds"), ("TEAL", "A blue-green color"),
    ("LIME", "A bright green fruit color"), ("NAVY", "A dark blue"),
    ("CYAN", "A bright sky blue"), ("BROWN", "The color of chocolate"),
    ("BLACK", "The darkest color"), ("WHITE", "The color of snow"),
]
D[("colors", "medium")] = [
    ("PURPLE", "Mix red and blue"), ("ORANGE", "A fruit and a color"),
    ("YELLOW", "The color of the sun"), ("SILVER", "A shiny gray metal color"),
    ("VIOLET", "A purple flower color"), ("INDIGO", "A deep blue in the rainbow"),
    ("MAROON", "A dark brownish red"), ("CORAL", "A pinkish ocean color"),
    ("BEIGE", "A light sandy color"), ("CRIMSON", "A deep rich red"),
    ("MAGENTA", "A bright pinkish purple"), ("COPPER", "A reddish metal color"),
]
D[("colors", "hard")] = [
    ("TURQUOISE", "A blue-green gemstone color"), ("LAVENDER", "A soft purple flower color"),
    ("BURGUNDY", "A deep red wine color"), ("EMERALD", "A bright green gem color"),
    ("SAPPHIRE", "A deep blue gem color"), ("CHARCOAL", "A very dark gray"),
    ("MULBERRY", "A dark purple berry color"), ("PLATINUM", "A pale silvery color"),
    ("PERIWINKLE", "A pale bluish purple"), ("AQUAMARINE", "A light sea-blue color"),
    ("CHESTNUT", "A reddish brown"), ("ROSEWOOD", "A deep reddish wood color"),
]
D[("sports", "easy")] = [
    ("BALL", "You kick or throw it"), ("GOAL", "Score one to win"),
    ("SWIM", "Moving through water"), ("RUN", "Faster than walking"),
    ("JUMP", "Leap into the air"), ("RACE", "A contest of speed"),
    ("TEAM", "Players working together"), ("BAT", "It hits the ball"),
    ("KICK", "Hit with your foot"), ("SURF", "Ride the waves"),
    ("SKI", "Glide on snow"), ("GYM", "Where you exercise"),
]
D[("sports", "medium")] = [
    ("SOCCER", "The world's favorite football"), ("TENNIS", "Rackets over a net"),
    ("HOCKEY", "Sticks and a puck"), ("BOXING", "A sport with gloves"),
    ("CYCLING", "Riding a bicycle fast"), ("RUNNING", "A race on foot"),
    ("CRICKET", "Bat, ball, and wickets"), ("ARCHERY", "Shooting arrows at a target"),
    ("SKATING", "Gliding on wheels or ice"), ("ROWING", "Racing with oars"),
    ("KARATE", "A martial art from Japan"), ("BOWLING", "Knock down all ten pins"),
]
D[("sports", "hard")] = [
    ("BASKETBALL", "Shoot hoops to score"), ("FOOTBALL", "Touchdowns and tackles"),
    ("BADMINTON", "Rackets and a shuttlecock"), ("VOLLEYBALL", "Hit the ball over the net"),
    ("SWIMMING", "Racing through water"), ("MARATHON", "A very long running race"),
    ("GYMNASTICS", "Flips, balance, and grace"), ("WRESTLING", "A grappling sport"),
    ("BASEBALL", "Home runs and bases"), ("CHAMPIONS", "The winners of it all"),
    ("ATHLETICS", "Track and field sports"), ("TRIATHLON", "Swim, cycle, then run"),
]
D[("space", "easy")] = [
    ("SUN", "Our closest star"), ("MOON", "Earth's night light"),
    ("STAR", "A twinkling light in space"), ("MARS", "The red planet"),
    ("SKY", "Look up to see it"), ("ROCKET", "It blasts off to space"),
    ("COMET", "A snowball with a glowing tail"), ("ALIEN", "A visitor from another world"),
    ("EARTH", "Our home planet"), ("VENUS", "The hottest planet"),
    ("PLUTO", "A famous dwarf planet"), ("ORBIT", "The path around a planet"),
]
D[("space", "medium")] = [
    ("PLANET", "A world that orbits a star"), ("GALAXY", "Billions of stars together"),
    ("SATURN", "The planet with rings"), ("JUPITER", "The biggest planet"),
    ("METEOR", "A shooting star"), ("GRAVITY", "The force that pulls you down"),
    ("ECLIPSE", "When the moon hides the sun"), ("MERCURY", "The planet closest to the sun"),
    ("NEPTUNE", "The farthest blue planet"), ("COSMOS", "Another word for universe"),
    ("LAUNCH", "When a rocket takes off"), ("NEBULA", "A colorful space cloud"),
]
D[("space", "hard")] = [
    ("ASTRONAUT", "A person who travels to space"), ("TELESCOPE", "It helps you see far stars"),
    ("SATELLITE", "It circles Earth in space"), ("UNIVERSE", "Everything that exists"),
    ("ASTEROID", "A big space rock"), ("SPACESHIP", "A vehicle for space travel"),
    ("SUPERNOVA", "A giant exploding star"), ("OBSERVATORY", "A building for watching stars"),
    ("COSMONAUT", "A Russian space traveler"), ("STARGAZING", "Watching the night sky"),
    ("METEORITE", "A space rock that lands on Earth"), ("SPACESUIT", "What astronauts wear"),
]
D[("ocean", "easy")] = [
    ("SEA", "A big body of salt water"), ("WAVE", "Water that rises and falls"),
    ("CRAB", "It walks sideways"), ("FISH", "It breathes through gills"),
    ("SAND", "Tiny grains on the beach"), ("REEF", "A colorful coral home"),
    ("SHIP", "A big boat"), ("BOAT", "It floats on water"),
    ("TIDE", "The sea rising and falling"), ("SHELL", "A sea creature's home"),
    ("CORAL", "A colorful reef builder"), ("PEARL", "A treasure inside an oyster"),
]
D[("ocean", "medium")] = [
    ("DOLPHIN", "A playful, clever sea mammal"), ("OCTOPUS", "It has eight arms"),
    ("SEAWEED", "A plant that grows in the sea"), ("WALRUS", "A sea animal with big tusks"),
    ("TURTLE", "It swims with a shell"), ("SAILOR", "A person who works at sea"),
    ("ANCHOR", "It keeps a ship in place"), ("LAGOON", "A calm shallow pool by the sea"),
    ("MARINE", "A word meaning of the sea"), ("URCHIN", "A spiky sea ball"),
    ("OYSTER", "It may hold a pearl"), ("STARFISH", "A five-armed sea star"),
]
D[("ocean", "hard")] = [
    ("JELLYFISH", "A see-through floating stinger"), ("SEAHORSE", "A tiny horse-shaped fish"),
    ("SWORDFISH", "A fish with a long sharp bill"), ("LIGHTHOUSE", "It guides ships at night"),
    ("SUBMARINE", "A ship that travels underwater"), ("SHIPWRECK", "A sunken ship"),
    ("PLANKTON", "Tiny drifting sea life"), ("BARNACLE", "It sticks to ships and rocks"),
    ("STINGRAY", "A flat fish with a long tail"), ("ANEMONE", "A flower-like sea creature"),
    ("MACKEREL", "A striped silvery fish"), ("NARWHAL", "The unicorn of the sea"),
]
D[("weather", "easy")] = [
    ("RAIN", "Drops falling from clouds"), ("SNOW", "White winter flakes"),
    ("WIND", "You feel it but cannot see it"), ("FOG", "A cloud near the ground"),
    ("HAIL", "Ice balls falling from the sky"), ("SUNNY", "Bright with no clouds"),
    ("CLOUD", "White and fluffy in the sky"), ("STORM", "Wild wind and rain"),
    ("MIST", "A thin light fog"), ("HEAT", "A very warm feeling"),
    ("COLD", "Brrr! The opposite of hot"), ("ICE", "Frozen water"),
]
D[("weather", "medium")] = [
    ("THUNDER", "The rumble after lightning"), ("DRIZZLE", "Very light rain"),
    ("TORNADO", "A spinning funnel of wind"), ("CYCLONE", "A huge spinning storm"),
    ("MONSOON", "A season of heavy rain"), ("FORECAST", "Tomorrow's weather guess"),
    ("HUMIDITY", "How damp the air feels"), ("RAINFALL", "How much rain has fallen"),
    ("SNOWFALL", "Snow coming down"), ("SUNSHINE", "Warm light from the sun"),
    ("BLIZZARD", "A fierce snowstorm"), ("TEMPEST", "A violent windy storm"),
]
D[("weather", "hard")] = [
    ("LIGHTNING", "An electric flash in the sky"), ("HURRICANE", "A giant ocean-born storm"),
    ("AVALANCHE", "Snow sliding down a mountain"), ("HEATWAVE", "Days of very hot weather"),
    ("RAINSTORM", "Heavy rain with wind"), ("SNOWSTORM", "Heavy snow with wind"),
    ("DOWNPOUR", "Sudden very heavy rain"), ("OVERCAST", "A sky fully covered in cloud"),
    ("BAROMETER", "It measures air pressure"), ("HAILSTORM", "A storm of falling ice"),
    ("WHIRLWIND", "A small spinning windstorm"), ("THERMOMETER", "It measures temperature"),
]

MAXLEN = {"easy": 10, "medium": 12, "hard": 14}

data = json.load(open("data/family-word-games.json", encoding="utf-8"))
entries = []
for (cat, diff), words in D.items():
    assert len(words) == 12, (cat, diff, len(words))
    seen = set()
    for w, hint in words:
        assert w.isalpha() and w.isupper(), w
        assert len(w) <= MAXLEN[diff], (w, diff)
        assert w not in seen, (cat, diff, w)
        seen.add(w)
        entries.append({
            "word": w,
            "display": w.capitalize(),
            "category": cat,
            "difficulty": diff,
            "hint": hint,
        })
data["wordSearch"] = entries
json.dump(data, open("data/family-word-games.json", "w", encoding="utf-8"),
          indent=2, ensure_ascii=True)
# verify round-trip
check = json.load(open("data/family-word-games.json", encoding="utf-8"))
print("wordSearch entries:", len(check["wordSearch"]),
      "| spelling preserved:", "spelling" in check and len(check["spelling"]) > 0)
