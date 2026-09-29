export const site = {
  name: "Б&Б Уникооп",
  url: "https://bbunikoop.com.mk",
  description: "Официјален SKF дистрибутер во Македонија. Каталог на лежишта со пребарување по ознака и филтер по индустрија.",
  // Demo only: hotlinked from icon-icons.com at the user's request.
  skfLogo: "https://images.icon-icons.com/2699/PNG/512/skf_logo_icon_170730.png",
  phones: [
    { city: "prilep" as const, tel: "+38970353619", label: "+389 70 353 619" },
    { city: "skopje" as const, tel: "+38970266179", label: "+389 70 266 179" },
  ],
  // key = Footer.social.<key> (accessible label) and the icon in SocialLinks
  socials: [
    { key: "facebook" as const, href: "https://www.facebook.com/people/BiB-Unikoop/61586984173642/" },
    { key: "linkedinCeo" as const, href: "https://www.linkedin.com/in/blagoja-dimeski-b2b534353" },
  ],
};
