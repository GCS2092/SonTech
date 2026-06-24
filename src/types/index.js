/**
 * Shapes des données basées sur le schema Prisma SonShop
 * Utilisé comme référence dans tout le frontend
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {'CUSTOMER'|'ADMIN'} role
 * @property {string} [phone]
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} description
 * @property {number} price
 * @property {number} [comparePrice]
 * @property {number} stock
 * @property {boolean} isActive
 * @property {boolean} isFeatured
 * @property {string} categoryId
 * @property {ProductImage[]} images
 * @property {ProductVariant[]} variants
 */

/**
 * @typedef {Object} ProductImage
 * @property {string} id
 * @property {string} url
 * @property {string} publicId
 * @property {number} position
 * @property {boolean} isMain
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id
 * @property {string} size
 * @property {string} color
 * @property {number} stock
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id
 * @property {number} quantity
 * @property {Product} product
 * @property {ProductVariant|null} variant
 */

/**
 * @typedef {Object} Cart
 * @property {string} id
 * @property {string|null} userId
 * @property {string|null} anonymousId
 * @property {CartItem[]} items
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} productName
 * @property {string|null} variantLabel
 * @property {number} price
 * @property {number} quantity
 * @property {number} subtotal
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} orderNumber
 * @property {'PENDING'|'CONFIRMED'|'PROCESSING'|'SHIPPED'|'DELIVERED'|'CANCELLED'} status
 * @property {'CASH_ON_DELIVERY'|'MOBILE_MONEY'} paymentMethod
 * @property {'PENDING'|'PARTIAL'|'PAID'} paymentStatus
 * @property {number} subtotal
 * @property {number} shippingCost
 * @property {number} discount
 * @property {number} total
 * @property {Object} shippingAddress
 * @property {OrderItem[]} items
 * @property {OrderTracking[]} tracking
 */

/**
 * @typedef {Object} OrderTracking
 * @property {string} id
 * @property {string} status
 * @property {string} message
 * @property {string|null} location
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} type
 * @property {string} title
 * @property {string} message
 * @property {boolean} isRead
 * @property {string|null} link
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {number} rating
 * @property {string|null} comment
 * @property {{ firstName: string, lastName: string }} user
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Address
 * @property {string} id
 * @property {string} label
 * @property {string} fullName
 * @property {string} phone
 * @property {string} street
 * @property {string} city
 * @property {string} country
 * @property {boolean} isDefault
 */