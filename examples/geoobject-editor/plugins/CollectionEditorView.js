define(['ready!ymaps', 'jquery', 'RectangleGeometry'], function (ymaps, $, RectangleGeometry) {

    var BaseMethods = {
        build: function () {
            views[this.layout].superclass.build.call(this);

            var el = this.getParentElement();

            this.menu = $('.nav', el)
                .on('click', $.proxy(this.onItemClick, this));
        },
        clear: function () {
            this.menu.off('click');

            views[this.layout].superclass.clear.call(this);
        },
        onItemClick: function () {}
    };

    var views = {
        CreateMenu: ymaps.templateLayoutFactory.createClass([
            '<ul class="nav nav-list">',
                '<li class="nav-header">Создать</li>',
                '<li><a href="#" data-geometry="Point">Метку</a></li>',
                '<li><a href="#" data-geometry="LineString">Ломаную линию</a></li>',
                '<li><a href="#" data-geometry="Polygon">Многоугольник</a></li>',
                '<li><a href="#" data-geometry="Rectangle">Прямоугольник</a></li>',
                '<li><a href="#" data-geometry="Circle">Круг</a></li>',
            '</ul>'
        ].join(''), {
            build: function () {
                this.layout = 'CreateMenu';
                BaseMethods.build.call(this);
            },
            clear: function () {
                BaseMethods.clear.call(this);
            },
            onItemClick: function (e) {
                var geometryType = $(e.target).data('geometry'),
                    collection = this.getData().geoObjects,
                    coordinates = this.getData().coordPosition,
                    center = coordinates.map(function (i) { return i.toFixed(6); }),
                    geoObject;

                e.preventDefault();

                switch(geometryType) {
                    case 'Point':
                        geoObject = new ymaps.Placemark(coordinates);
                        break;
                    case 'LineString':
                        geoObject = new ymaps.Polyline([coordinates]);
                        break;
                    case 'Polygon':
                        geoObject = new ymaps.Polygon([[coordinates, coordinates]]);
                        break;
                    case 'Rectangle':
                        geoObject = new ymaps.Rectangle(RectangleGeometry.createFromCenterAndSize(coordinates, [1000, 1000]), {
                            center: center,
                            width: 1000,
                            height: 1000
                        });
                        break;
                    case 'Circle':
                        geoObject = new ymaps.Circle([coordinates, 500], {
                            center: center,
                            radius: 500
                        });
                        break;
                }

                collection.events.fire('actioncreate', {
                    type: 'actioncreate',
                    target: geoObject
                });
            }
        }),

        EditMenu: ymaps.templateLayoutFactory.createClass([
            '<ul class="nav nav-list">',
                '<li class="nav-header">Действие</li>',
                '<li><a href="#" data-action="edit">Редактировать</a></li>',
                '<li><a href="#" data-action="clone">Редактировать копию</a></li>',
                '<li><a href="#" data-action="delete">Удалить</a></li>',
            '</ul>'
        ].join(''), {
            build: function () {
                this.layout = 'EditMenu';
                BaseMethods.build.call(this);
            },
            clear: function () {
                BaseMethods.clear.call(this);
            },
            onItemClick: function (e) {
                var action = $(e.target).data('action'),
                    eventType = 'action' + action,
                    geoObject = this.getData().geoObject,
                    collection = this.getData().geoObjects;

                e.preventDefault();

                collection.events.fire(eventType, {
                    type: eventType,
                    target: geoObject
                });
            }
        })
    };

    function CollectionEditorView() {}

    (function () {
        this.getLayout = function (key) {
            return views[key.charAt(0).toUpperCase() + key.substring(1)];
        };
    }).call(CollectionEditorView.prototype);

    return CollectionEditorView;
});
