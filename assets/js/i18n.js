// ════════════════════════════════════════════════════════════════
//  Translations — English / Kurdish (Sorani).
//  Values may contain <span> for accent words; they are our own text,
//  never user data, so data-i18n-html is safe for them.
// ════════════════════════════════════════════════════════════════
import { $$ } from './util.js';

const en = {
  skip: 'Skip to content', brandSub: 'Print & Design', menu: 'Menu', close: 'Close', back: 'Back',
  home: 'Home', shop: 'Shop', designers: 'Designers', about: 'About', contact: 'Contact', profile: 'Profile',
  dashboard: 'Dashboard', collection: 'Collection', favourites: 'Favourites', customDesign: 'Custom Design',
  login: 'Login', signup: 'Sign Up', signOut: 'Sign out', cart: 'Shopping cart', total: 'Total', checkout: 'Checkout',
  language: 'Language', languageDesc: 'Switch between English and Kurdish', installApp: 'Install app', installDesc: 'Add Naxshin to your home screen',

  heroBadge: 'Kurdish Heritage · Modern Expression', heroH1: 'Fashion Crafted <span>for Every Story</span>',
  heroP: 'Discover unique print-on-demand fashion from local designers. Wear your culture, express your identity.',
  shopNow: 'Shop Now', partner: 'Become a Partner →',
  ad: 'AD', sponsored: 'Sponsored partners', advertiseHere: 'Advertise here →', visit: 'Visit', adNoDesc: 'No description provided.',
  trending: 'Trending <span>Now</span>', newArrivals: 'New <span>Arrivals</span>', allProducts: 'All <span>Products</span>',
  allProductsPlain: 'All products', seeAll: 'See all →', shopTitle: 'All <span>Products</span>', designersTitle: 'Our <span>Designers</span>',
  searchPlaceholder: 'Search products, designers…', designerSearch: 'Search designers…',
  sortBy: 'Sort by', sortNew: 'Newest', sortLow: 'Price: low to high', sortHigh: 'Price: high to low',
  catAll: 'All', catTshirt: 'T-shirts', catHoodie: 'Hoodies', catDress: 'Dresses', catJacket: 'Jackets', catPants: 'Pants', catAccessory: 'Accessories', catCollab: 'Collabs',
  badgeNew: 'NEW', badgeHot: 'HOT', badgeCollab: 'COLLAB',
  noProducts: 'No products yet.', noProductsDesigner: 'Designers — sign in to upload your first design →',
  noResults: 'Nothing matches your search.', loadingFailed: 'Couldn’t load this. Check your connection.', retry: 'Try again', loading: 'Loading…',
  by: 'By {name}', color: 'Colour', size: 'Size', chooseSize: 'Please choose a size', addToCart: 'Add to cart',
  addToWish: 'Add to favourites', removeWish: 'Remove from favourites', addedToCart: '{name} added to your cart',
  addedWish: 'Added to favourites', removedWish: 'Removed from favourites', onlyLeft: 'Only {n} left',
  view2d: '2D', view3d: '3D', dragRotate: 'Drag to rotate', premiumQuality: 'Premium quality garment.',
  unavailable: 'No longer available', remove: 'Remove', each: '{price} each', cartEmpty: 'Your cart is empty',
  cartRemovedItems: 'Some items are no longer available and were left out.',

  designerBadge: 'DESIGNER', activeDesigns: '{n} active designs', oneDesign: '1 active design', tapProfile: 'Tap to view profile',
  noDesigners: 'No designers yet.', designerNotFound: 'Designer not found.', noBio: 'No bio yet.',
  rateDesigner: 'Rate this designer', ratingSaved: 'Rating saved', rateSignIn: 'Sign in to rate designers', rateOwn: 'You can’t rate yourself',
  ratingNew: 'New', designsCount: '{n} <span>designs</span>', noActiveDesigns: 'No active designs yet.',

  aboutBadge: 'Our Story', aboutTitle: 'About <span>Naxshin</span>',
  aboutSub: 'A Kurdish-rooted fashion platform connecting local designers, print partners, and customers.',
  aboutMission: 'Our Mission',
  aboutMissionText: 'Naxshin was born from a desire to celebrate Kurdish identity through wearable art. We partner with local designers, give them a platform to share their creations, and connect them with customers who want authentic, meaningful clothing. Our name — Naxshin — means “decorated” or “adorned” in Kurdish.',
  statProducts: 'Products', statDesigners: 'Designers', statCustomers: 'Customers', statPartners: 'Partners',

  contactTitle: 'Contact <span>Us</span>', yourName: 'Your name', email: 'Email', subject: 'Subject', message: 'Message',
  attach: 'Attach image (optional)', sendMsg: 'Send message',
  subjGeneral: 'General inquiry', subjPartner: 'Partnership', subjOrder: 'Order issue', subjDesign: 'Design submission', subjBug: 'Report a bug',
  msgSent: 'Message sent! We’ll reply within 2–3 days.', fillRequired: 'Please fill in the required fields.', badEmail: 'Please enter a valid email.',
  imageTooLarge: 'That image is too large. Try a smaller one.', notImage: 'Please choose an image file.',

  footerDesc: 'Where Kurdish heritage meets modern design. Wear your story.', company: 'Company', account: 'Account', collaborate: 'Collaborate',
  footerCopy: '© {year} Naxshin Print & Design — Made with ❤️ in Kurdistan',

  signIn: 'Sign in', signInSub: 'Welcome back to Naxshin', signInToOrder: 'Sign in to place your order', signInFirst: 'Please sign in first',
  password: 'Password', forgot: 'Forgot?', continue: 'Continue', or: 'or', googleSignIn: 'Continue with Google',
  noAccount: 'Don’t have an account?', signUpLink: 'Sign up', haveAccount: 'Already have an account?', signInLink: 'Sign in',
  createAccount: 'Create account', createSub: 'Join the Naxshin community', fullName: 'Full name', minPassword: 'At least 6 characters',
  requestRole: 'I am joining as', roleCustomer: 'Customer', roleDesigner: 'Designer', rolePrinter: 'Printer', roleAdvertiser: 'Advertiser',
  roleAdmin: 'Admin', roleTechnician: 'Technician',
  roleNote: 'Designer, printer and advertiser accounts are approved by our team first.',
  welcomeBack: 'Welcome back! 👋', welcome: 'Welcome to Naxshin! 🎉', accountPending: 'Account created! We’ll review your {role} request soon.',
  signedOut: 'Signed out', resetSent: 'Password reset email sent', enterEmailFirst: 'Enter your email first',
  errWrongLogin: 'Wrong email or password.', errEmailInUse: 'That email is already registered.', errWeakPw: 'Password must be at least 6 characters.',
  errTooMany: 'Too many attempts. Please wait a moment and try again.', errNetwork: 'No connection. Check your internet and try again.',
  errPopup: 'The sign-in window was blocked. Allow pop-ups and try again.', errDomain: 'This website isn’t allowed to use Google sign-in yet (add it in Firebase → Authentication → Settings → Authorized domains).',
  errRecentLogin: 'For your security, please sign out and sign in again, then retry.', errPermission: 'You don’t have permission to do that.',
  errGeneric: 'Something went wrong. Please try again.', profileLoadFailed: 'We couldn’t load your profile. Some features may be limited.',

  tabInfo: 'Profile', tabOrders: 'My orders', tabWishlist: 'Favourites', tabSettings: 'Settings', tabReport: 'Report bug',
  phone: 'Phone', bio: 'Bio / about me', bioHint: '(shown on your public designer profile)', newPassword: 'New password', leaveBlank: 'Leave blank to keep',
  saveChanges: 'Save changes', saved: 'Saved ✓', change: 'Change', changePhoto: 'Change photo', photoUpdated: 'Photo updated ✓',
  newEmailPrompt: 'New email address', emailVerifySent: 'We sent a link to {email}. Open it to finish changing your email.',
  pendingRole: 'Your request to join as {role} is waiting for approval.', rejectedRole: 'Your partner request wasn’t approved. Contact us if you have questions.',
  noOrders: 'No orders yet.', startShopping: 'Start shopping →', emptyWish: 'Your favourites list is empty.',
  deleteAccount: 'Delete account', deleteAccountDesc: 'Ask us to permanently remove your account', requestDeletion: 'Request',
  deletionConfirm: 'Send a request to delete your account? Our team will contact you to confirm.', deletionSent: 'Request sent. We’ll be in touch.',
  bugDesc: 'What went wrong?', bugImg: 'Attach a screenshot (optional)', submitReport: 'Send report', bugSent: 'Thanks — report sent!',

  partnerTitle: 'Partner with Naxshin', partnerSub: 'Choose how you’d like to collaborate.', printPartner: 'Print partner', brandCollab: 'Brand collab',
  partnerName: 'Name / company', submitPartner: 'Send request →', partnerSent: 'Request sent! We’ll contact you soon.', chooseType: 'Please choose a partnership type.',

  checkoutTitle: 'Complete your order', checkoutSub: 'Fill in your delivery details', orderId: 'Order ID',
  location: 'Delivery location', locationPh: 'City, district, street…', note: 'Note (optional)', payment: 'Payment method', payCash: 'Cash',
  placeOrder: 'Place order →', badPhone: 'Please enter a valid phone number.', orderPlaced: 'Order placed!', orderPlacedSub: 'Your order has been received.',
  orderQueued: 'You’re offline — your order is saved and will be sent automatically when you’re back online.',
  yourOrderId: 'Your order ID', sendWhatsApp: 'Send order on WhatsApp', whatsAppHint: 'Sending it on WhatsApp helps us confirm faster.',
  trackOrders: 'Track my orders', orderFailed: 'Your order couldn’t be placed. Please try again.', cartIsEmpty: 'Your cart is empty',
  date: 'Date', items: 'Items', status: 'Status',
  st_pending: 'Pending', st_confirmed: 'Confirmed', st_delivering: 'On the way', st_completed: 'Delivered', st_cancelled: 'Cancelled',
  st_active: 'Active', st_inactive: 'Hidden', st_rejected: 'Rejected', st_open: 'Open', st_resolved: 'Resolved',

  twofa: 'Two-step sign-in', twofaDesc: 'Ask for a code from an authenticator app when signing in', twofaOn: 'On', enable: 'Turn on', disable: 'Turn off',
  twofaSetup: 'Turn on two-step sign-in', twofaSetupSub: 'Scan with Google Authenticator or Authy', manualKey: 'Manual entry key',
  enterCode: 'Enter the 6-digit code', activate: 'Activate', twofaVerifySub: 'Enter the 6-digit code from your authenticator app',
  verify: 'Verify →', useOtherAccount: 'Cancel and sign out', wrongCode: 'Wrong code. Try again.', twofaEnabled: 'Two-step sign-in is on ✓',
  twofaDisabled: 'Two-step sign-in is off', twofaDisablePrompt: 'Enter a current code to turn off two-step sign-in',

  customTitle: 'Custom design request', customSub: 'Ask Naxshin or one of our designers to create your own design', customWho: 'Who should create your design?',
  customTeam: 'Naxshin team', customDesigners: 'Our designers', anyDesigner: 'Any available designer', garment: 'Garment', preferredColor: 'Preferred colour',
  colorPh: 'e.g. black, forest green, sand…', customIdea: 'Describe your idea *', customIdeaPh: 'Text, Kurdish motif, artwork, front/back placement…',
  phoneWhatsApp: 'Phone / WhatsApp', customSend: 'Send request on WhatsApp', customSent: 'Opening WhatsApp…',

  installTitle: 'Install the Naxshin app', installSub: 'Add Naxshin to your home screen for quick, full-screen access.',
  installIos: 'tap Share, then “Add to Home Screen”.', installAndroid: 'tap ⋮, then “Install app”.', installDesktop: 'click the install icon in the address bar.',
  gotIt: 'Got it', installing: 'Installing Naxshin ✓',
  offline: 'You’re offline. Showing saved content.', backOnline: 'Back online ✓', firebaseDown: 'Can’t reach our servers right now. Browsing still works; sign-in and orders will return when the connection does.',
  confirm: 'Confirm', cancel: 'Cancel', yes: 'Yes', delete: 'Delete', edit: 'Edit', approve: 'Approve', reject: 'Reject', save: 'Save', ok: 'OK',

  // dashboard
  dashOverview: 'Overview', dashUsers: 'Users', dashProducts: 'Products', dashMyDesigns: 'My designs', dashUpload: 'Add product', dashUploadDesign: 'Upload design',
  dashOrders: 'Orders', dashRequests: 'Requests', dashAnalytics: 'Analytics', dashAds: 'Ads', dashBugs: 'Bug reports', dashRules: 'Security rules',
  dashInbox: 'Inbox', dashSales: 'Sales', dashQueue: 'Print queue', dashBackToShop: 'Back to shop', dashWelcome: 'Welcome, {name} 👋',
  dashCustomerSub: 'Your shopping overview', cartItems: 'Cart items', quickActions: 'Quick actions', browseShop: 'Browse shop', viewCart: 'View cart',
  revenue: 'Revenue', unitsSold: 'Units sold', pendingOrders: 'Pending orders', inQueue: 'In queue', users: 'Users', printers: 'Printers',
  recentOrders: 'Recent orders', customer: 'Customer', city: 'Location', actions: 'Actions', priceCheck: 'Price differs from the current product price',
  topCustomers: 'Top customers', topProducts: 'Top products', qtySold: 'Qty sold', noData: 'No data yet',
  role: 'Role', setRole: 'Set role', requestedRole: 'Requested role', noPending: 'No pending requests', userApproved: 'Approved ✓', userRejected: 'Request rejected',
  roleUpdated: 'Role updated ✓', statusUpdated: 'Status updated ✓', deleted: 'Deleted', confirmDelete: 'Delete this permanently?',
  markPrinted: 'Printed → on the way', markDelivered: 'Mark delivered', changeStatus: 'Change status…',
  productName: 'Product name', description: 'Description', category: 'Category', garmentTypes: 'Can be printed on', priceUsd: 'Price (USD $)',
  stock: 'Stock', stockHint: '(0 = unlimited)', sizes: 'Sizes', colors: 'Colours', colorsHint: '(optional photo for each colour)', uploadColorPhoto: 'Add photo',
  productImage: 'Design image', uploadImage: 'Tap to upload — compressed automatically', orPasteUrl: 'Or paste an image link (https://…)',
  publishStatus: 'Status', submitDesign: 'Submit design', saveProduct: 'Save product', productSubmitted: 'Design submitted for review ✓',
  productSaved: 'Product saved ✓', productApproved: 'Approved ✓', productBackToReview: 'The new picture will be reviewed before it goes live.',
  needNamePrice: 'Add a name and a price.', needImage: 'Add a design image.', productTooLarge: 'Too many large photos — remove some colour photos and try again.',
  editProduct: 'Edit product', noDesignsYet: 'No designs yet.', addFirstDesign: 'Add your first design →', badge: 'Badge', none: 'None',
  advertiser: 'Advertiser / brand', adText: 'Description', adLink: 'Visit link (optional)', adMedia: 'Ad image or video', adMediaUrl: 'Or paste a media link (needed for video)',
  publishAd: 'Publish ad', adPublished: 'Ad published ✓', adRemoved: 'Ad removed', activeAds: 'Active ads', noAds: 'No ads yet', adsHint: 'Ads rotate every 6 seconds on the homepage.',
  videoNeedsUrl: 'Videos need a hosted link below.', bugsOpen: '{n} open', bugsResolved: '{n} resolved', resolve: 'Resolve', resolved: 'Resolved ✓',
  inboxEmpty: 'No messages', markHandled: 'Mark done', handled: 'Done', fromLabel: 'From', typeLabel: 'Type',
  rulesIntro: 'These are the security rules for this version of the site. Publish them in Firebase Console → Firestore → Rules.',
  copy: 'Copy', copied: 'Copied ✓', openConsole: 'Open Firebase Console', authUsers: 'Manage sign-in users', liveData: 'Live data — updated {time}',
  syncDirectory: 'Designer directory updated',
};

const ku = {
  skip: 'بڕۆ بۆ ناوەڕۆک', brandSub: 'چاپ و دیزاین', menu: 'لیست', close: 'داخستن', back: 'گەڕانەوە',
  home: 'سەرەکی', shop: 'فرۆشگا', designers: 'دیزاینەرەکان', about: 'دەربارەمان', contact: 'پەیوەندی', profile: 'پڕۆفایل',
  dashboard: 'داشبۆرد', collection: 'کاڵاکان', favourites: 'دڵخوازەکان', customDesign: 'دیزاینی تایبەت',
  login: 'چوونەژوورەوە', signup: 'تۆمارکردن', signOut: 'دەرچوون', cart: 'سەبەتەی کڕین', total: 'کۆی گشتی', checkout: 'تەواوکردنی کڕین',
  language: 'زمان', languageDesc: 'گۆڕین لە نێوان ئینگلیزی و کوردی', installApp: 'دابەزاندنی ئەپ', installDesc: 'نەخشین زیاد بکە بۆ شاشەی سەرەکی',

  heroBadge: 'میراتی کوردی · دیزاینی مۆدێرن', heroH1: 'جلوبەرگ بۆ هەموو <span>چیرۆکێک</span>',
  heroP: 'دیزاینی ناوخۆی کوردی بدۆزەرەوە. کەلتووری خۆت لەبەر بکە، ناسنامەکەت دەربخە.',
  shopNow: 'ئێستا بکڕە', partner: 'ببە بە هاوبەش ←',
  ad: 'ڕیکلام', sponsored: 'هاوبەشە سپۆنسەرەکان', advertiseHere: 'ڕیکلامی خۆت لێرە ←', visit: 'سەردان', adNoDesc: 'هیچ وەسفێک نییە.',
  trending: '<span>باوترینەکان</span>', newArrivals: 'نوێترین <span>کاڵاکان</span>', allProducts: 'هەموو <span>کاڵاکان</span>',
  allProductsPlain: 'هەموو کاڵاکان', seeAll: 'هەمووی ببینە ←', shopTitle: 'هەموو <span>کاڵاکان</span>', designersTitle: '<span>دیزاینەرەکان</span>مان',
  searchPlaceholder: 'گەڕان بۆ کاڵا، دیزاینەر…', designerSearch: 'گەڕان بۆ دیزاینەر…',
  sortBy: 'ڕیزکردن', sortNew: 'نوێترین', sortLow: 'نرخ: کەم بۆ زۆر', sortHigh: 'نرخ: زۆر بۆ کەم',
  catAll: 'هەمووی', catTshirt: 'تیشێرت', catHoodie: 'هودی', catDress: 'کراس', catJacket: 'جاکێت', catPants: 'پانتۆڵ', catAccessory: 'ئێکسسوار', catCollab: 'هاوکاری',
  badgeNew: 'نوێ', badgeHot: 'باو', badgeCollab: 'هاوکاری',
  noProducts: 'هێشتا هیچ کاڵایەک نییە.', noProductsDesigner: 'دیزاینەران — بچنە ژوورەوە و یەکەم دیزاینتان بار بکەن ←',
  noResults: 'هیچ شتێک لەگەڵ گەڕانەکەت ناگونجێت.', loadingFailed: 'نەتوانرا باربکرێت. پەیوەندی ئینتەرنێتەکەت بپشکنە.', retry: 'دووبارە هەوڵبدەوە', loading: 'باردەکرێت…',
  by: 'لەلایەن {name}', color: 'ڕەنگ', size: 'قەبارە', chooseSize: 'تکایە قەبارەیەک هەڵبژێرە', addToCart: 'زیادکردن بۆ سەبەتە',
  addToWish: 'زیادکردن بۆ دڵخوازەکان', removeWish: 'لابردن لە دڵخوازەکان', addedToCart: '{name} خرایە سەبەتەکەت',
  addedWish: 'خرایە دڵخوازەکان', removedWish: 'لە دڵخوازەکان لابرا', onlyLeft: 'تەنها {n} دانە ماوە',
  view2d: '2D', view3d: '3D', dragRotate: 'ڕابکێشە بۆ سوڕاندن', premiumQuality: 'جلێکی کوالیتی بەرز.',
  unavailable: 'ئیتر بەردەست نییە', remove: 'لابردن', each: 'هەر دانەیەک {price}', cartEmpty: 'سەبەتەکەت بەتاڵە',
  cartRemovedItems: 'هەندێک کاڵا ئیتر بەردەست نین و لابران.',

  designerBadge: 'دیزاینەر', activeDesigns: '{n} دیزاینی چالاک', oneDesign: '1 دیزاینی چالاک', tapProfile: 'کرتە بکە بۆ بینینی پڕۆفایل',
  noDesigners: 'هێشتا هیچ دیزاینەرێک نییە.', designerNotFound: 'دیزاینەرەکە نەدۆزرایەوە.', noBio: 'هێشتا هیچ دەربارەیەک نەنووسراوە.',
  rateDesigner: 'هەڵسەنگاندنی ئەم دیزاینەرە', ratingSaved: 'هەڵسەنگاندنەکەت پاشەکەوت کرا', rateSignIn: 'بۆ هەڵسەنگاندن بچۆ ژوورەوە', rateOwn: 'ناتوانیت خۆت هەڵبسەنگێنیت',
  ratingNew: 'نوێ', designsCount: '{n} <span>دیزاین</span>', noActiveDesigns: 'هێشتا هیچ دیزاینێکی چالاک نییە.',

  aboutBadge: 'چیرۆکەکەمان', aboutTitle: 'دەربارەی <span>نەخشین</span>',
  aboutSub: 'پلاتفۆرمێکی فاشنی کوردی کە دیزاینەرانی ناوخۆ، چاپخانەکان و کڕیاران بەیەکەوە دەبەستێتەوە.',
  aboutMission: 'ئامانجمان',
  aboutMissionText: 'نەخشین لە ئارەزووی بەرزڕاگرتنی ناسنامەی کوردی لە ڕێگەی هونەرێکەوە لەدایک بوو کە لەبەر دەکرێت. هاوکاری دیزاینەرانی ناوخۆ دەکەین، شوێنێکیان بۆ دەڕەخسێنین بۆ نیشاندانی بەرهەمەکانیان، و دەیانگەیەنین بەو کڕیارانەی جلی ڕەسەن و پڕمانایان دەوێت. ناوی «نەخشین» بە واتای ڕازاوە و نەخشێنراو دێت.',
  statProducts: 'کاڵاکان', statDesigners: 'دیزاینەرەکان', statCustomers: 'کڕیارەکان', statPartners: 'هاوبەشەکان',

  contactTitle: 'پەیوەندیمان <span>پێوە بکە</span>', yourName: 'ناوت', email: 'ئیمەیڵ', subject: 'بابەت', message: 'پەیام',
  attach: 'هاوپێچکردنی وێنە (ئارەزوومەندانە)', sendMsg: 'ناردنی پەیام',
  subjGeneral: 'پرسیاری گشتی', subjPartner: 'هاوبەشی', subjOrder: 'کێشەی داواکاری', subjDesign: 'ناردنی دیزاین', subjBug: 'ڕاپۆرتکردنی کێشە',
  msgSent: 'پەیامەکەت نێردرا! لە ماوەی ٢–٣ ڕۆژدا وەڵام دەدەینەوە.', fillRequired: 'تکایە خانە پێویستەکان پڕبکەوە.', badEmail: 'تکایە ئیمەیڵێکی دروست بنووسە.',
  imageTooLarge: 'ئەو وێنەیە زۆر گەورەیە. وێنەیەکی بچووکتر تاقی بکەوە.', notImage: 'تکایە فایلێکی وێنە هەڵبژێرە.',

  footerDesc: 'کەلتووری کوردی بە دیزاینی مۆدێرن. چیرۆکەکەت لەبەر بکە.', company: 'کۆمپانیا', account: 'هەژمار', collaborate: 'هاوکاری',
  footerCopy: '© {year} نەخشین چاپ و دیزاین — بە ❤️ لە کوردستان دروستکراوە',

  signIn: 'چوونەژوورەوە', signInSub: 'بەخێربێیتەوە بۆ نەخشین', signInToOrder: 'بۆ ناردنی داواکاری بچۆ ژوورەوە', signInFirst: 'تکایە سەرەتا بچۆ ژوورەوە',
  password: 'وشەی نهێنی', forgot: 'لەبیرت چووە؟', continue: 'بەردەوامبوون', or: 'یان', googleSignIn: 'چوونەژوورەوە بە گووگڵ',
  noAccount: 'هەژمارت نییە؟', signUpLink: 'تۆمارکردن', haveAccount: 'پێشتر هەژمارت هەیە؟', signInLink: 'چوونەژوورەوە',
  createAccount: 'دروستکردنی هەژمار', createSub: 'بەشداری کۆمەڵگەی نەخشین بکە', fullName: 'ناوی تەواو', minPassword: 'لانیکەم ٦ پیت',
  requestRole: 'وەک چی بەشداری دەکەیت', roleCustomer: 'کڕیار', roleDesigner: 'دیزاینەر', rolePrinter: 'چاپخانە', roleAdvertiser: 'ڕیکلامکار',
  roleAdmin: 'ئەدمین', roleTechnician: 'تەکنیکار',
  roleNote: 'هەژماری دیزاینەر، چاپخانە و ڕیکلامکار سەرەتا لەلایەن تیمەکەمانەوە پەسەند دەکرێن.',
  welcomeBack: 'بەخێربێیتەوە! 👋', welcome: 'بەخێربێیت بۆ نەخشین! 🎉', accountPending: 'هەژمارەکەت دروستکرا! بەم زووانە داواکاریی {role}ـەکەت دەبینین.',
  signedOut: 'دەرچوویت', resetSent: 'ئیمەیڵی گۆڕینی وشەی نهێنی نێردرا', enterEmailFirst: 'سەرەتا ئیمەیڵەکەت بنووسە',
  errWrongLogin: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.', errEmailInUse: 'ئەم ئیمەیڵە پێشتر تۆمارکراوە.', errWeakPw: 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت.',
  errTooMany: 'هەوڵی زۆر درا. کەمێک چاوەڕێ بکە و دووبارە هەوڵبدەوە.', errNetwork: 'ئینتەرنێت نییە. پەیوەندییەکەت بپشکنە و دووبارە هەوڵبدەوە.',
  errPopup: 'پەنجەرەی چوونەژوورەوە ڕێگری لێکرا. ڕێگە بە پۆپ‌ئەپ بدە و دووبارە هەوڵبدەوە.', errDomain: 'ئەم ماڵپەڕە هێشتا ڕێگەی چوونەژوورەوە بە گووگڵی پێنەدراوە.',
  errRecentLogin: 'بۆ پاراستنی هەژمارەکەت، دەربچۆ و دووبارە بچۆ ژوورەوە، پاشان هەوڵبدەوە.', errPermission: 'ڕێگەت پێنەدراوە ئەمە بکەیت.',
  errGeneric: 'هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵبدەوە.', profileLoadFailed: 'نەتوانرا پڕۆفایلەکەت باربکرێت. هەندێک تایبەتمەندی سنووردار دەبن.',

  tabInfo: 'پڕۆفایل', tabOrders: 'داواکارییەکانم', tabWishlist: 'دڵخوازەکان', tabSettings: 'ڕێکخستنەکان', tabReport: 'ڕاپۆرتی کێشە',
  phone: 'تەلەفۆن', bio: 'دەربارەی خۆت', bioHint: '(لە پڕۆفایلی گشتیی دیزاینەرەکەت دەردەکەوێت)', newPassword: 'وشەی نهێنیی نوێ', leaveBlank: 'بەتاڵی بهێڵەوە بۆ نەگۆڕین',
  saveChanges: 'پاشەکەوتکردن', saved: 'پاشەکەوت کرا ✓', change: 'گۆڕین', changePhoto: 'گۆڕینی وێنە', photoUpdated: 'وێنەکە نوێکرایەوە ✓',
  newEmailPrompt: 'ئیمەیڵی نوێ', emailVerifySent: 'بەستەرێکمان نارد بۆ {email}. بیکەرەوە بۆ تەواوکردنی گۆڕینی ئیمەیڵ.',
  pendingRole: 'داواکاریت بۆ بەشداریکردن وەک {role} چاوەڕێی پەسەندکردنە.', rejectedRole: 'داواکاریی هاوبەشیت پەسەند نەکرا. ئەگەر پرسیارت هەیە پەیوەندیمان پێوە بکە.',
  noOrders: 'هێشتا هیچ داواکارییەک نییە.', startShopping: 'دەست بە کڕین بکە ←', emptyWish: 'لیستی دڵخوازەکانت بەتاڵە.',
  deleteAccount: 'سڕینەوەی هەژمار', deleteAccountDesc: 'داوامان لێ بکە هەژمارەکەت بە یەکجاری بسڕینەوە', requestDeletion: 'داواکردن',
  deletionConfirm: 'داوای سڕینەوەی هەژمارەکەت بنێریت؟ تیمەکەمان بۆ دڵنیابوونەوە پەیوەندیت پێوە دەکات.', deletionSent: 'داواکارییەکە نێردرا. پەیوەندیت پێوە دەکەین.',
  bugDesc: 'چی هەڵە بوو؟', bugImg: 'وێنەی شاشە (ئارەزوومەندانە)', submitReport: 'ناردنی ڕاپۆرت', bugSent: 'سوپاس — ڕاپۆرتەکە نێردرا!',

  partnerTitle: 'ببە بە هاوبەشی نەخشین', partnerSub: 'جۆری هاوکارییەکەت هەڵبژێرە.', printPartner: 'هاوبەشی چاپ', brandCollab: 'هاوکاریی براند',
  partnerName: 'ناو / کۆمپانیا', submitPartner: 'ناردنی داواکاری ←', partnerSent: 'داواکارییەکەت نێردرا! بەم زووانە پەیوەندیت پێوە دەکەین.', chooseType: 'تکایە جۆری هاوبەشی هەڵبژێرە.',

  checkoutTitle: 'داواکارییەکەت تەواو بکە', checkoutSub: 'زانیاریی گەیاندن پڕبکەوە', orderId: 'ژمارەی داواکاری',
  location: 'شوێنی گەیاندن', locationPh: 'شار، گەڕەک، شەقام…', note: 'تێبینی (ئارەزوومەندانە)', payment: 'شێوازی پارەدان', payCash: 'نەختینە',
  placeOrder: 'ناردنی داواکاری ←', badPhone: 'تکایە ژمارەی تەلەفۆنێکی دروست بنووسە.', orderPlaced: 'داواکارییەکەت تۆمار کرا!', orderPlacedSub: 'داواکارییەکەت وەرگیرا.',
  orderQueued: 'ئینتەرنێتت نییە — داواکارییەکەت پاشەکەوت کرا و کاتێک ئینتەرنێت گەڕایەوە خۆکارانە دەنێردرێت.',
  yourOrderId: 'ژمارەی داواکارییەکەت', sendWhatsApp: 'ناردنی داواکاری بە واتسئاپ', whatsAppHint: 'ناردنی بە واتسئاپ یارمەتیمان دەدات خێراتر پشتڕاستی بکەینەوە.',
  trackOrders: 'شوێنکەوتنی داواکارییەکانم', orderFailed: 'داواکارییەکەت نەنێردرا. تکایە دووبارە هەوڵبدەوە.', cartIsEmpty: 'سەبەتەکەت بەتاڵە',
  date: 'بەروار', items: 'کاڵاکان', status: 'دۆخ',
  st_pending: 'چاوەڕوان', st_confirmed: 'پشتڕاستکراوە', st_delivering: 'لە ڕێگادایە', st_completed: 'گەیەندرا', st_cancelled: 'هەڵوەشێنرایەوە',
  st_active: 'چالاک', st_inactive: 'شاراوە', st_rejected: 'ڕەتکرایەوە', st_open: 'کراوە', st_resolved: 'چارەسەرکرا',

  twofa: 'چوونەژوورەوەی دوو هەنگاوی', twofaDesc: 'لە کاتی چوونەژوورەوە کۆدێک لە ئەپی ئۆتێنتیکەیتەر داوا بکە', twofaOn: 'چالاکە', enable: 'چالاککردن', disable: 'ناچالاککردن',
  twofaSetup: 'چالاککردنی چوونەژوورەوەی دوو هەنگاوی', twofaSetupSub: 'بە Google Authenticator یان Authy سکانی بکە', manualKey: 'کلیلی نووسینی دەستی',
  enterCode: 'کۆدە ٦ ژمارەییەکە بنووسە', activate: 'چالاککردن', twofaVerifySub: 'کۆدە ٦ ژمارەییەکە لە ئەپی ئۆتێنتیکەیتەرەکەت بنووسە',
  verify: 'پشتڕاستکردنەوە ←', useOtherAccount: 'هەڵوەشاندنەوە و دەرچوون', wrongCode: 'کۆدەکە هەڵەیە. دووبارە هەوڵبدەوە.', twofaEnabled: 'چوونەژوورەوەی دوو هەنگاوی چالاکە ✓',
  twofaDisabled: 'چوونەژوورەوەی دوو هەنگاوی ناچالاک کرا', twofaDisablePrompt: 'بۆ ناچالاککردن کۆدێکی ئێستا بنووسە',

  customTitle: 'داواکردنی دیزاینی تایبەت', customSub: 'داوا لە نەخشین یان دیزاینەرەکانمان بکە دیزاینی تایبەتت بۆ دروست بکەن', customWho: 'کێ دیزاینەکەت دروست بکات؟',
  customTeam: 'تیمی نەخشین', customDesigners: 'دیزاینەرەکانمان', anyDesigner: 'هەر دیزاینەرێکی بەردەست', garment: 'جۆری جل', preferredColor: 'ڕەنگی دڵخواز',
  colorPh: 'بۆ نموونە: ڕەش، سەوزی تۆخ، خۆڵەمێشی…', customIdea: 'بیرۆکەکەت بنووسە *', customIdeaPh: 'نووسین، نەخشی کوردی، وێنە، شوێنی چاپ (پێشەوە/دواوە)…',
  phoneWhatsApp: 'تەلەفۆن / واتسئاپ', customSend: 'ناردنی داواکاری بە واتسئاپ', customSent: 'واتسئاپ دەکرێتەوە…',

  installTitle: 'دابەزاندنی ئەپی نەخشین', installSub: 'نەخشین زیاد بکە بۆ شاشەی سەرەکی بۆ دەستگەیشتنی خێرا و پڕشاشە.',
  installIos: 'Share دابگرە، پاشان «Add to Home Screen».', installAndroid: '⋮ دابگرە، پاشان «Install app».', installDesktop: 'لە شریتی ناونیشان کرتە لە ئایکۆنی دابەزاندن بکە.',
  gotIt: 'باشە', installing: 'نەخشین دادەبەزێت ✓',
  offline: 'ئینتەرنێتت نییە. ناوەڕۆکی پاشەکەوتکراو پیشان دەدرێت.', backOnline: 'ئینتەرنێت گەڕایەوە ✓', firebaseDown: 'ئێستا ناتوانین بگەینە سێرڤەرەکانمان. گەڕان کار دەکات؛ چوونەژوورەوە و داواکاری کاتێک پەیوەندی گەڕایەوە کار دەکەنەوە.',
  confirm: 'دڵنیام', cancel: 'پاشگەزبوونەوە', yes: 'بەڵێ', delete: 'سڕینەوە', edit: 'دەستکاری', approve: 'پەسەندکردن', reject: 'ڕەتکردنەوە', save: 'پاشەکەوت', ok: 'باشە',

  dashOverview: 'پوختە', dashUsers: 'بەکارهێنەران', dashProducts: 'کاڵاکان', dashMyDesigns: 'دیزاینەکانم', dashUpload: 'زیادکردنی کاڵا', dashUploadDesign: 'بارکردنی دیزاین',
  dashOrders: 'داواکارییەکان', dashRequests: 'داواکان', dashAnalytics: 'ئامارەکان', dashAds: 'ڕیکلامەکان', dashBugs: 'ڕاپۆرتی کێشەکان', dashRules: 'یاساکانی ئاسایش',
  dashInbox: 'نامەکان', dashSales: 'فرۆشتن', dashQueue: 'ڕیزی چاپ', dashBackToShop: 'گەڕانەوە بۆ فرۆشگا', dashWelcome: 'بەخێربێیت، {name} 👋',
  dashCustomerSub: 'پوختەی کڕینەکانت', cartItems: 'کاڵاکانی سەبەتە', quickActions: 'کردارە خێراکان', browseShop: 'سەیرکردنی فرۆشگا', viewCart: 'بینینی سەبەتە',
  revenue: 'داهات', unitsSold: 'دانەی فرۆشراو', pendingOrders: 'داواکاریی چاوەڕوان', inQueue: 'لە ڕیزدا', users: 'بەکارهێنەران', printers: 'چاپخانەکان',
  recentOrders: 'دوایین داواکارییەکان', customer: 'کڕیار', city: 'شوێن', actions: 'کردارەکان', priceCheck: 'نرخەکە جیاوازە لە نرخی ئێستای کاڵاکە',
  topCustomers: 'باشترین کڕیاران', topProducts: 'باشترین کاڵاکان', qtySold: 'ژمارەی فرۆشراو', noData: 'هێشتا هیچ زانیارییەک نییە',
  role: 'ڕۆڵ', setRole: 'دانانی ڕۆڵ', requestedRole: 'ڕۆڵی داواکراو', noPending: 'هیچ داواکارییەکی چاوەڕوان نییە', userApproved: 'پەسەند کرا ✓', userRejected: 'داواکارییەکە ڕەتکرایەوە',
  roleUpdated: 'ڕۆڵەکە نوێکرایەوە ✓', statusUpdated: 'دۆخەکە نوێکرایەوە ✓', deleted: 'سڕایەوە', confirmDelete: 'بە یەکجاری بیسڕیتەوە؟',
  markPrinted: 'چاپکرا ← لە ڕێگادایە', markDelivered: 'گەیەندرا', changeStatus: 'گۆڕینی دۆخ…',
  productName: 'ناوی کاڵا', description: 'وەسف', category: 'جۆر', garmentTypes: 'دەتوانرێت لەسەر ئەمانە چاپ بکرێت', priceUsd: 'نرخ (دۆلار $)',
  stock: 'بڕی بەردەست', stockHint: '(0 = بێسنوور)', sizes: 'قەبارەکان', colors: 'ڕەنگەکان', colorsHint: '(وێنەی ئارەزوومەندانە بۆ هەر ڕەنگێک)', uploadColorPhoto: 'زیادکردنی وێنە',
  productImage: 'وێنەی دیزاین', uploadImage: 'کرتە بکە بۆ بارکردن — خۆکارانە بچووک دەکرێتەوە', orPasteUrl: 'یان بەستەری وێنەیەک دابنێ (https://…)',
  publishStatus: 'دۆخ', submitDesign: 'ناردنی دیزاین', saveProduct: 'پاشەکەوتکردنی کاڵا', productSubmitted: 'دیزاینەکە نێردرا بۆ پێداچوونەوە ✓',
  productSaved: 'کاڵاکە پاشەکەوت کرا ✓', productApproved: 'پەسەند کرا ✓', productBackToReview: 'وێنە نوێیەکە پێش بڵاوبوونەوە پێداچوونەوەی بۆ دەکرێت.',
  needNamePrice: 'ناو و نرخ زیاد بکە.', needImage: 'وێنەی دیزاین زیاد بکە.', productTooLarge: 'وێنە گەورەکان زۆرن — هەندێک وێنەی ڕەنگ لاببە و دووبارە هەوڵبدەوە.',
  editProduct: 'دەستکاریی کاڵا', noDesignsYet: 'هێشتا هیچ دیزاینێک نییە.', addFirstDesign: 'یەکەم دیزاینت زیاد بکە ←', badge: 'نیشانە', none: 'هیچ',
  advertiser: 'ڕیکلامکار / براند', adText: 'وەسف', adLink: 'بەستەری سەردان (ئارەزوومەندانە)', adMedia: 'وێنە یان ڤیدیۆی ڕیکلام', adMediaUrl: 'یان بەستەری میدیا دابنێ (بۆ ڤیدیۆ پێویستە)',
  publishAd: 'بڵاوکردنەوەی ڕیکلام', adPublished: 'ڕیکلامەکە بڵاوکرایەوە ✓', adRemoved: 'ڕیکلامەکە لابرا', activeAds: 'ڕیکلامە چالاکەکان', noAds: 'هێشتا هیچ ڕیکلامێک نییە', adsHint: 'ڕیکلامەکان هەر ٦ چرکە جارێک لە پەڕەی سەرەکی دەگۆڕێن.',
  videoNeedsUrl: 'ڤیدیۆ پێویستی بە بەستەرێکی ئۆنلاین هەیە لە خوارەوە.', bugsOpen: '{n} کراوە', bugsResolved: '{n} چارەسەرکراو', resolve: 'چارەسەرکرا', resolved: 'چارەسەرکرا ✓',
  inboxEmpty: 'هیچ نامەیەک نییە', markHandled: 'تەواوە', handled: 'تەواوە', fromLabel: 'لە', typeLabel: 'جۆر',
  rulesIntro: 'ئەمانە یاساکانی ئاسایشی ئەم وەشانەی ماڵپەڕەکەن. لە Firebase Console ← Firestore ← Rules بڵاویان بکەرەوە.',
  copy: 'کۆپی', copied: 'کۆپی کرا ✓', openConsole: 'کردنەوەی Firebase Console', authUsers: 'بەڕێوەبردنی بەکارهێنەرانی چوونەژوورەوە', liveData: 'زانیاریی ڕاستەوخۆ — نوێکراوە {time}',
  syncDirectory: 'لیستی دیزاینەران نوێکرایەوە',
};

const DICT = { en, ku };
let lang = (() => { try { return localStorage.getItem('naxshin-lang') === 'ku' ? 'ku' : 'en'; } catch { return 'en'; } })();

export const getLang = () => lang;
export function t(key, vars) {
  let s = DICT[lang][key] ?? en[key] ?? key;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}
/** Plain-text version (drops our own <span> accents). */
export const tt = (key, vars) => t(key, vars).replace(/<[^>]+>/g, '');

export function setLang(next) {
  lang = next === 'ku' ? 'ku' : 'en';
  try { localStorage.setItem('naxshin-lang', lang); } catch { /* private mode */ }
  applyI18n();
}

export function applyI18n(root = document) {
  const html = document.documentElement;
  html.lang = lang === 'ku' ? 'ckb' : 'en';
  html.dir = lang === 'ku' ? 'rtl' : 'ltr';
  document.title = lang === 'ku' ? 'نەخشین — چاپ و دیزاین' : 'Naxshin — Print & Design';
  $$('[data-i18n]', root).forEach((el) => { el.textContent = tt(el.dataset.i18n); });
  $$('[data-i18n-html]', root).forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$('[data-i18n-ph]', root).forEach((el) => { el.placeholder = tt(el.dataset.i18nPh); });
  $$('[data-i18n-aria]', root).forEach((el) => { el.setAttribute('aria-label', tt(el.dataset.i18nAria)); });
  $$('[data-lang-label]', root).forEach((el) => { el.textContent = lang === 'ku' ? 'English' : 'کوردی'; });
  $$('[data-footer-copy]', root).forEach((el) => { el.textContent = tt('footerCopy', { year: new Date().getFullYear() }); });
}

export const roleLabel = (r) => tt('role' + String(r || 'customer').charAt(0).toUpperCase() + String(r || 'customer').slice(1));
export const statusLabel = (s) => tt('st_' + (s || 'pending'));
