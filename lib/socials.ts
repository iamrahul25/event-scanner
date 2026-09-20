import { FaInstagram, FaFacebook, FaLinkedin, FaXTwitter, FaGithub, FaYoutube, FaGlobe } from "react-icons/fa6";
import { type IconType } from "react-icons";
import { type SocialLinks } from "./users";

export type SocialMetaInfo = {
  key: keyof SocialLinks;
  label: string;
  icon: IconType;
  colorClass: string;
  bgClass: string;
};

export const SOCIAL_META: SocialMetaInfo[] = [
  { key: "instagram", label: "Instagram", icon: FaInstagram, colorClass: "text-pink-500", bgClass: "bg-pink-100" },
  { key: "facebook", label: "Facebook", icon: FaFacebook, colorClass: "text-blue-600", bgClass: "bg-blue-100" },
  { key: "linkedin", label: "LinkedIn", icon: FaLinkedin, colorClass: "text-sky-600", bgClass: "bg-sky-100" },
  { key: "twitter", label: "Twitter", icon: FaXTwitter, colorClass: "text-zinc-800", bgClass: "bg-zinc-200" },
  { key: "github", label: "GitHub", icon: FaGithub, colorClass: "text-zinc-800", bgClass: "bg-zinc-200" },
  { key: "youtube", label: "YouTube", icon: FaYoutube, colorClass: "text-red-600", bgClass: "bg-red-100" },
  { key: "website", label: "Website", icon: FaGlobe, colorClass: "text-teal-600", bgClass: "bg-teal-100" },
];
