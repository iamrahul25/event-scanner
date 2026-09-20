import type { SocialLinks, UserProfile } from "./users";

const FIRST_NAMES = [
  "Ava",
  "Noah",
  "Mia",
  "Liam",
  "Zoe",
  "Ethan",
  "Iris",
  "Owen",
  "Luna",
  "Kai",
  "Nora",
  "Leo",
  "Aria",
  "Jude",
  "Ella",
  "Finn",
  "Ruby",
  "Max",
  "Ivy",
  "Cole",
  "Sage",
  "Beau",
  "Vera",
  "Rex",
  "Chloe",
  "Miles",
  "Quinn",
  "Dean",
  "Hazel",
  "Seth",
  "Piper",
  "Omar",
  "June",
  "Troy",
  "Nina",
  "Cruz",
  "Willa",
  "Asher",
  "Remy",
  "Blair",
  "Theo",
  "Skye",
  "Hugo",
  "Freya",
  "Nico",
  "Dahlia",
  "Jasper",
  "Mabel",
  "Felix",
  "Cora",
] as const;

const LAST_NAMES = [
  "Chen",
  "Patel",
  "Nguyen",
  "Garcia",
  "Kim",
  "Brooks",
  "Singh",
  "Walsh",
  "Torres",
  "Reed",
  "Park",
  "Diaz",
  "Hayes",
  "Ali",
  "Foster",
  "Bennett",
  "Shah",
  "Cruz",
  "Morgan",
  "Lee",
  "Bailey",
  "Ramos",
  "Clark",
  "Young",
  "Price",
  "Wright",
  "Adams",
  "Bell",
  "Hunt",
  "Lane",
  "Grant",
  "Stone",
  "West",
  "Cole",
  "Fox",
  "Gray",
  "Hill",
  "King",
  "Long",
  "Moss",
  "Nash",
  "Page",
  "Quinn",
  "Ross",
  "Shaw",
  "Tate",
  "Vance",
  "Webb",
  "York",
  "Zane",
] as const;

function socialsFor(slug: string, index: number): SocialLinks {
  // Vary which platforms each demo user has so the panel feels realistic.
  const pattern = index % 6;
  return {
    instagram:
      pattern !== 4 ? `https://instagram.com/${slug.replace(".", "")}` : null,
    facebook:
      pattern === 0 || pattern === 2
        ? `https://facebook.com/${slug.replace(".", "")}`
        : null,
    linkedin:
      pattern !== 5 ? `https://linkedin.com/in/${slug.replace(".", "-")}` : null,
    twitter:
      pattern === 0 || pattern === 1 || pattern === 3
        ? `https://x.com/${slug.replace(".", "")}`
        : null,
    github:
      pattern !== 2 ? `https://github.com/${slug.replace(".", "-")}` : null,
  };
}

/** 50 static users for orbit UI testing (not from Firestore). */
export const DUMMY_USERS: UserProfile[] = FIRST_NAMES.map((first, i) => {
  const last = LAST_NAMES[i]!;
  const displayName = `${first} ${last}`;
  const slug = `${first}.${last}`.toLowerCase();

  return {
    uid: `dummy-user-${String(i + 1).padStart(2, "0")}`,
    email: `${slug}@example.com`,
    displayName,
    photoURL: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(displayName)}`,
    socials: socialsFor(slug, i),
  };
});

