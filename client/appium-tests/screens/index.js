/**
 * Mobile Screen Object Model exports
 */
const BaseScreen = require('./BaseScreen');

class LoginScreen extends BaseScreen {
  get emailInput() { return '~login-email-input'; }
  get passwordInput() { return '~login-password-input'; }
  get loginButton() { return '~login-submit-button'; }
  get registerLink() { return '~register-link'; }
  get errorMessage() { return '~login-error-message'; }

  async login(email, password) {
    await this.setValue(this.emailInput, email);
    await this.setValue(this.passwordInput, password);
    await this.click(this.loginButton);
  }
}

class RegistrationScreen extends BaseScreen {
  get nameInput() { return '~register-name-input'; }
  get emailInput() { return '~register-email-input'; }
  get passwordInput() { return '~register-password-input'; }
  get phoneInput() { return '~register-phone-input'; }
  get submitButton() { return '~register-submit-button'; }
}

class HomeScreen extends BaseScreen {
  get searchBar() { return '~home-search-bar'; }
  get locationBadge() { return '~home-location-badge'; }
  get restaurantCards() { return '~restaurant-card'; }
  get filterButton() { return '~home-filter-btn'; }
}

class LocationScreen extends BaseScreen {
  get grantPermissionBtn() { return '~location-grant-btn'; }
  get manualSearchInput() { return '~location-manual-input'; }
  get citySuggestions() { return '~location-suggestion-item'; }
}

class RestaurantListScreen extends BaseScreen {
  get listContainer() { return '~restaurant-list-container'; }
  get cuisineFilter() { return '~cuisine-filter-chips'; }
  get sortDropdown() { return '~sort-dropdown'; }
}

class RestaurantDetailsScreen extends BaseScreen {
  get title() { return '~restaurant-details-title'; }
  get liveTableSection() { return '~live-table-section'; }
  get crowdIndicator() { return '~crowd-level-badge'; }
  get waitTimeDisplay() { return '~wait-time-value'; }
  get reserveButton() { return '~reserve-table-btn'; }
  get viewMenuButton() { return '~view-menu-btn'; }
}

class TableAvailabilityScreen extends BaseScreen {
  get tableGrid() { return '~table-grid-view'; }
  get availableTables() { return '~table-item-available'; }
  get occupiedTables() { return '~table-item-occupied'; }
  get reservedTables() { return '~table-item-reserved'; }
}

class ReservationScreen extends BaseScreen {
  get datePicker() { return '~reservation-date-picker'; }
  get timePicker() { return '~reservation-time-picker'; }
  get guestsCount() { return '~reservation-guest-stepper'; }
  get confirmButton() { return '~reservation-confirm-btn'; }
}

class BookingHistoryScreen extends BaseScreen {
  get bookingList() { return '~booking-history-list'; }
  get activeBookingCard() { return '~active-booking-item'; }
  get cancelBookingBtn() { return '~cancel-booking-btn'; }
}

class MenuScreen extends BaseScreen {
  get categoryTabs() { return '~menu-category-tabs'; }
  get foodItemList() { return '~menu-item-card'; }
  get addItemButton() { return '~add-to-cart-btn'; }
}

class CartScreen extends BaseScreen {
  get cartItemList() { return '~cart-items-container'; }
  get checkoutButton() { return '~cart-checkout-btn'; }
  get totalAmount() { return '~cart-total-amount'; }
}

class QRScreen extends BaseScreen {
  get qrScannerView() { return '~qr-camera-scanner'; }
  get manualTableCodeInput() { return '~manual-table-code-input'; }
  get scanSubmitBtn() { return '~qr-submit-btn'; }
}

class OrderScreen extends BaseScreen {
  get orderStatusTracker() { return '~order-status-stepper'; }
  get orderIdLabel() { return '~order-id-label'; }
  get estimatedTimeLabel() { return '~order-eta-label'; }
}

class BillingScreen extends BaseScreen {
  get billSummary() { return '~bill-summary-card'; }
  get paymentOptions() { return '~payment-methods-radio'; }
  get payNowBtn() { return '~pay-now-btn'; }
}

class NotificationScreen extends BaseScreen {
  get notificationList() { return '~notifications-list'; }
  get clearAllBtn() { return '~clear-notifications-btn'; }
}

class ProfileScreen extends BaseScreen {
  get userNameLabel() { return '~profile-user-name'; }
  get userEmailLabel() { return '~profile-user-email'; }
  get logoutButton() { return '~profile-logout-btn'; }
}

module.exports = {
  BaseScreen,
  LoginScreen,
  RegistrationScreen,
  HomeScreen,
  LocationScreen,
  RestaurantListScreen,
  RestaurantDetailsScreen,
  TableAvailabilityScreen,
  ReservationScreen,
  BookingHistoryScreen,
  MenuScreen,
  CartScreen,
  QRScreen,
  OrderScreen,
  BillingScreen,
  NotificationScreen,
  ProfileScreen
};
