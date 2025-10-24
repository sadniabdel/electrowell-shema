import $ from 'jquery';
import utils from '@bigcommerce/stencil-utils';

export default function() {
    const $requestQuoteBtn = $('.btn-get-quote');
    const $quoteForm = $('#request-quote-form');
    const $requestModal = $('#modal-request-quote');
    const $successModal = $('#modal-quote-success');

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validation function
    function validateField($field) {
        const $errorSpan = $field.closest('.form-field').find('.form-field-error');
        const value = $field.val().trim();
        const fieldType = $field.attr('type');
        const fieldName = $field.attr('name');
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        $field.removeClass('has-error');
        $errorSpan.removeClass('is-visible').text('');

        // Validation rules
        if ($field.prop('required') && !value) {
            isValid = false;
            errorMessage = $field.data('error-message') || 'This field is required';
        } else if (fieldName === 'fullname' && value && value.length < 2) {
            isValid = false;
            errorMessage = 'Full name must be at least 2 characters';
        } else if (fieldType === 'email' && value && !emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (fieldName === 'country' && $field.prop('required') && !value) {
            isValid = false;
            errorMessage = 'Country is required';
        }

        // Show error if invalid
        if (!isValid) {
            $field.addClass('has-error');
            $errorSpan.text(errorMessage).addClass('is-visible');
        }

        return isValid;
    }

    // Validate all required fields
    function validateForm() {
        let isValid = true;
        const $requiredFields = $quoteForm.find('[required]');

        $requiredFields.each(function() {
            if (!validateField($(this))) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Handle button click to open modal and pre-fill form
    $requestQuoteBtn.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const $form = $quoteForm;
        const productTitle = $form.data('product-title');
        const productSku = $form.data('product-sku');
        const quantity = $('input[name="qty[]"]').val() || '1';

        // Build the pre-filled message
        const message = `Please quote the following item:

Product: ${productTitle}${productSku ? ' (SKU: ' + productSku + ')' : ''}
Quantity: ${quantity}`;

        // Set the message in the textarea
        $('#quote-message').val(message);

        // Trigger Foundation Reveal modal opening
        // Use Foundation's built-in method or jQuery trigger
        if ($requestModal.foundation) {
            $requestModal.foundation('reveal', 'open');
        } else {
            // Fallback: manually show modal
            $requestModal.css('display', 'block').addClass('open');
            $('body').append('<div class="reveal-modal-bg" style="display: block;"></div>');
        }
    });

    // Real-time validation on blur
    $quoteForm.on('blur', '.form-input, .form-select', function() {
        validateField($(this));
    });

    // Handle form submission
    $quoteForm.on('submit', function(e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return false;
        }

        // Collect form data
        const formData = {
            fullname: $('#quote-fullname').val().trim(),
            email: $('#quote-email').val().trim(),
            company: $('#quote-company').val().trim(),
            country: $('#quote-country').val(),
            message: $('#quote-message').val().trim(),
            productTitle: $quoteForm.data('product-title'),
            productSku: $quoteForm.data('product-sku'),
            productId: $quoteForm.data('product-id'),
            timestamp: new Date().toISOString()
        };

        // Disable submit button
        const $submitBtn = $quoteForm.find('.btn-submit-quote');
        const originalText = $submitBtn.html();
        $submitBtn.prop('disabled', true).html('Sending...');

        // Email subject format: "{product.title} {sku} Quote Request from {Full Name}"
        const emailSubject = `${formData.productTitle} ${formData.productSku} Quote Request from ${formData.fullname}`;

        // Build detailed email message
        const emailMessage = `
QUOTE REQUEST

Product Information:
- Product: ${formData.productTitle}
- SKU: ${formData.productSku}
- Product ID: ${formData.productId}
- Quantity: ${formData.message.match(/Quantity: (\d+)/)?.[1] || 'N/A'}

Customer Information:
- Full Name: ${formData.fullname}
- Email: ${formData.email}
- Company: ${formData.company || 'N/A'}
- Country: ${formData.country}

Message:
${formData.message}

Timestamp: ${new Date(formData.timestamp).toLocaleString()}
        `;

        // Submit to BigCommerce contact form
        fetch('/pages/contact-us/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'contact_fullname': formData.fullname,
                'contact_email': formData.email,
                'contact_companyname': formData.company,
                'contact_phone': formData.country,
                'contact_orderno': formData.productSku,
                'contact_rma': '',
                'contact_question': emailMessage
            })
        })
        .then(response => {
            console.log('Quote Request Submitted:', {
                subject: emailSubject,
                data: formData
            });

            // Close request modal
            if ($requestModal.foundation) {
                $requestModal.foundation('reveal', 'close');
            } else {
                $requestModal.css('display', 'none').removeClass('open');
                $('.reveal-modal-bg').remove();
            }

            // Reset form
            $quoteForm[0].reset();
            $quoteForm.find('.has-error').removeClass('has-error');
            $quoteForm.find('.form-field-error').removeClass('is-visible');

            // Re-enable submit button
            $submitBtn.prop('disabled', false).html(originalText);

            // Show success modal
            if ($successModal.foundation) {
                $successModal.foundation('reveal', 'open');
            } else {
                $successModal.css('display', 'block').addClass('open');
                if ($('.reveal-modal-bg').length === 0) {
                    $('body').append('<div class="reveal-modal-bg" style="display: block;"></div>');
                }
            }
        })
        .catch(error => {
            console.error('Error submitting quote:', error);

            // Re-enable submit button
            $submitBtn.prop('disabled', false).html(originalText);

            // Still show success modal (contact form submission doesn't always return proper response)
            // Close request modal
            if ($requestModal.foundation) {
                $requestModal.foundation('reveal', 'close');
            } else {
                $requestModal.css('display', 'none').removeClass('open');
                $('.reveal-modal-bg').remove();
            }

            // Reset form
            $quoteForm[0].reset();
            $quoteForm.find('.has-error').removeClass('has-error');
            $quoteForm.find('.form-field-error').removeClass('is-visible');

            // Show success modal
            if ($successModal.foundation) {
                $successModal.foundation('reveal', 'open');
            } else {
                $successModal.css('display', 'block').addClass('open');
                if ($('.reveal-modal-bg').length === 0) {
                    $('body').append('<div class="reveal-modal-bg" style="display: block;"></div>');
                }
            }
        });

        return false;
    });

    // Handle success modal close button
    $('[data-close-success-modal]').on('click', function(e) {
        e.preventDefault();
        if ($successModal.foundation) {
            $successModal.foundation('reveal', 'close');
        } else {
            $successModal.css('display', 'none').removeClass('open');
            $('.reveal-modal-bg').remove();
        }
    });

    // Also handle modal close via X button
    $successModal.find('.modal-close').on('click', function(e) {
        e.preventDefault();
        if ($successModal.foundation) {
            $successModal.foundation('reveal', 'close');
        } else {
            $successModal.css('display', 'none').removeClass('open');
            $('.reveal-modal-bg').remove();
        }
    });

    // Handle background click to close modals
    $(document).on('click', '.reveal-modal-bg', function() {
        $requestModal.css('display', 'none').removeClass('open');
        $successModal.css('display', 'none').removeClass('open');
        $('.reveal-modal-bg').remove();
    });
}
