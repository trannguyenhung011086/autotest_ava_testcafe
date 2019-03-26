Feature: Navigate sales at home page

    User can see all sales at home page.

    Scenario: User can see featured sales

        Given user is not logged in
        When user is at home page
        Then user can see featured sales at the top
        And user can click a sale to go to ongoing sale page

    Scenario: User can see today sales

        Given user is not logged in
        When user is at home page
        Then user can see today sales below featured sales
        And user can click a sale to go to ongoing sale page

    Scenario: User can see POTD sales

        Given user is not logged in
        When user is at home page
        Then user can see POTD sales below today sales
        And user can click a sale to go to product page

    Scenario: User can see best sellers

        Given user is not logged in
        When user is at home page
        Then user can see best sellers below POTD sales
        And user can click a product to go to product page

    Scenario: User can see current sales

        Given user is not logged in
        When user is at home page
        Then user can see current sales below today sales
        And user can click a sale to go to ongoing sale page

    Scenario: User can see upcoming sales

        Given user is not logged in
        When user is at home page
        Then user can see upcoming sales below current sales
        And user can click a sale to go to upcoming sale page