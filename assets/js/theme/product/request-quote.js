import $ from 'jquery';

export default function() {
    const $requestQuoteBtn = $('[data-reveal-id="modal-request-quote"]');
    const $messageTextarea = $('#quote-message');

    // When Request Quote button is clicked, pre-fill the message
    $requestQuoteBtn.on('click', function() {
        const productTitle = $messageTextarea.data('product-title');
        const productSku = $messageTextarea.data('product-sku');
        const quantity = $('input[name="qty[]"]').val() || '1';

        // Build the pre-filled message
        const message = `Please quote the following item:

Product: ${productTitle}${productSku ? ' (SKU: ' + productSku + ')' : ''}
Quantity: ${quantity}`;

        // Set the message in the textarea
        $messageTextarea.val(message);
    });

    // Handle form submission
    $('#request-quote-form').on('submit', function(e) {
        e.preventDefault();

        const formData = {
            fullname: $('#quote-fullname').val(),
            email: $('#quote-email').val(),
            company: $('#quote-company').val(),
            country: $('#quote-country').val(),
            message: $('#quote-message').val()
        };

        // You can implement your own submission logic here
        // For now, we'll just show a success alert
        alert('Thank you for your quote request! We will contact you shortly.');

        // Close the modal
        $('#modal-request-quote').foundation('reveal', 'close');

        // Reset the form
        this.reset();
    });
}
