(function() {
    'use strict';

    angular
        .module('gofarModule', [
            //'ngRoute',
            'ui.router',
            'ngCookies',
            'ngStorage'
        ])
    
        .config(function($stateProvider, $urlRouterProvider, $httpProvider) {
            // Injects http interceptor factory to http interceptor
            $httpProvider.interceptors.push('AuthInterceptor');
        
            /*//working with $routeProvider
            $routeProvider
                .when("/list", {
                    templateUrl : "templates/list.html"
                })
                .when("/view", {
                    templateUrl : "templates/view.html"
                })
                .when("/edit", {
                    templateUrl : "templates/edit.html"
                })
                .when("/add", {
                    templateUrl : "templates/add.html"
                });*/
                
            //working with $stateProvider
            $stateProvider            
                .state('home', {
                    url: '/',
                    templateUrl: 'templates/home.html',
                    controller: 'homeCtrl',
                    controllerAs: 'homeC'
                }) 
                // nested states(or views)
                .state('home.login', {
                    url: 'login',
                    views: {
                        //where 'auth' is my ui-view name
                        "auth": {
                            templateUrl: 'templates/login.html',
                            controller: 'loginCtrl',
                            controllerAs: 'loginC'
                        }
                    }
                })
            
                .state('home.register', {
                    url: 'register',
                    views: {
                        "auth": {
                            templateUrl: 'templates/register.html',
                            controller: 'registerCtrl',
                            controllerAs: 'registerC'
                        }
                    }
                })
            
                .state('portal', {
                    url: '/portal',
                    templateUrl: 'templates/portal.html',
                    controller: 'portalCtrl',
                    controllerAs: 'portalC'
                })

                .state('portal.list', {
                    url: '/list',
                    views: {
                        "crud": {
                            templateUrl: 'templates/list.html'
                        }
                    }
                })
            
                .state('portal.view', {
                    url: '/view',
                    views: {
                        "crud": {
                            templateUrl: 'templates/view.html'
                        }
                    }
                })
                
                .state('portal.edit', {
                    url: '/edit',
                    views: {
                        "crud": {
                            templateUrl: 'templates/edit.html'
                        }
                    },
                //contains type of user who can access this state
                    params: {
                        roles : ['user', 'admin']
                    }
                })
        
                .state('portal.add', {
                    url: '/add',
                    views: {
                        "crud": {
                            templateUrl: 'templates/add.html'
                        }
                    },
                    params: {
                        roles : ['user', 'admin']
                    }
                })
            
                .state('unauthorized', {
                    url: '/unauthorized',
                    templateUrl: 'templates/unauthorized.html',
                    controller: 'unauthoCtrl',
                    controllerAs: 'unauthoC'
                });
            $urlRouterProvider.otherwise('/');
        })
    
        .run(['$rootScope', '$location', '$http', '$state', '$localStorage', function($rootScope, $location, $http, $state, $localStorage) {
            $rootScope.$on('$locationChangeStart', function (event, next, current) {
                // retricts user from accessing unauthorized page by entering url
                if (($state.current.params && ($state.current.params && $state.current.params.roles.indexOf($localStorage.currentUser.role) == -1)) || $state.current.name == 'unauthorized') {
                    $state.go('unauthorized');
                }
                var isRestrictedPage = ['', '/', '/login', '/register'].indexOf($location.path()) === -1;
                // redirect to login page if not logged in and trying to access a restricted page
                if (isRestrictedPage && $localStorage.currentUser.isloggedIn == false){
                    $state.go('home');
                    console.log('User not logged in.');
                }
            });
        }])
    
        .factory('interceptorFactory', function(){
            var self = {};
        
            self.AuthInterceptor = function($q, $location, $localStorage){
                return {
                    // could return request, requestError, response, or responseError interceptor method
                    // following methods takes promise as input
                    'request': function (config) {
                        config.headers = config.headers || {};
                        // Inserts token to http request header
                        if ($localStorage.currentUser && $localStorage.currentUser.token) {
                            config.headers.Authorization = 'Bearer ' + $localStorage.currentUser.token;
                        }
                        return config;
                    },
                    'response' : function(response){
                        // Finds user role from response and sets it in localStorage
                        if(response.status === 200 && response && response.userRole) {
                            $localStorage.currentUser.role = response.userRole;
                        }
                    },
                    'responseError': function(response) {
                        // redirect user to login page in case of call failure
                        if(response.status === 401 || response.status === 403) {
                            $location.path('login');
                            $localStorage.currentUser.isLoggedin = false;
                        }
                        return $q.reject(response);
                    }
                };
            }
            
            return self;    
        });
})();
