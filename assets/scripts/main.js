$(document).on('click', '.hamburger', function () {
    $('.menu').show();

    $(".menu").animate({
      left: '30%',
      opacity: '1',
    },
    );

  });


  $(document).on('click', '.menu-esc', function () {
    $(".menu").animate({
      left: '-30%',
      opacity: '0',
    },
    );
    // $('.menu').hide();

  });