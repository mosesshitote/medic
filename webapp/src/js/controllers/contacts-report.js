angular.module('inboxControllers').controller('ContactsReportCtrl',
  function (
    $log,
    $ngRedux,
    $scope,
    $state,
    $translate,
    Actions,
    ContactViewModelGenerator,
    Enketo,
    Geolocation,
    Snackbar,
    Telemetry,
    TranslateFrom,
    XmlForm
  ) {

    'use strict';
    'ngInject';

    const telemetryData = {
      preRender: Date.now()
    };

    var ctrl = this;
    var mapStateToTarget = function(state) {
      return {
        enketoStatus: state.enketoStatus
      };
    };
    var unsubscribe = $ngRedux.connect(mapStateToTarget, Actions)(ctrl);

    var geolocation;
    Geolocation()
      .then(function(position) {
        geolocation = position;
      })
      .catch($log.warn);

    var markFormEdited = function() {
      ctrl.setEnketoEditedStatus(true);
    };

    var setCancelCallback = function() {
      ctrl.setCancelCallback(function() {
        $state.go('contacts.detail', { id: $state.params.id });
      });
    };

    var render = function(contact) {
      $scope.setSelected(contact);
      setCancelCallback();
      return XmlForm($state.params.formId, { include_docs: true })
        .then(function(form) {
          var instanceData = {
            source: 'contact',
            contact: contact.doc,
          };
          ctrl.setEnketoEditedStatus(false);
          return Enketo
            .render('#contact-report', form.id, instanceData, markFormEdited)
            .then(function(formInstance) {
              $scope.setTitle(TranslateFrom(form.doc.title));
              $scope.form = formInstance;
              $scope.loadingForm = false;
            })
            .then(() => {
              telemetryData.postRender = Date.now();
              telemetryData.form = $state.params.formId;

              Telemetry.record(
                `enketo:contacts:${telemetryData.form}:add:render`,
                telemetryData.postRender - telemetryData.preRender);
            });
        });
    };

    $scope.save = function() {
      if (ctrl.enketoStatus.saving) {
        $log.debug('Attempted to call contacts-report:$scope.save more than once');
        return;
      }

      telemetryData.preSave = Date.now();
      Telemetry.record(
        `enketo:contacts:${telemetryData.form}:add:user_edit_time`,
        telemetryData.preSave - telemetryData.postRender);

      ctrl.setEnketoSavingStatus(true);
      ctrl.setEnketoError(null);
      Enketo.save($state.params.formId, $scope.form, geolocation)
        .then(function(docs) {
          $log.debug('saved report and associated docs', docs);
          ctrl.setEnketoSavingStatus(false);
          $translate('report.created').then(Snackbar);
          ctrl.setEnketoEditedStatus(false);
          $state.go('contacts.detail', { id: $state.params.id });
        })
        .then(() => {
          telemetryData.postSave = Date.now();

          Telemetry.record(
            `enketo:contacts:${telemetryData.form}:add:save`,
            telemetryData.postSave - telemetryData.preSave);
        })
        .catch(function(err) {
          ctrl.setEnketoSavingStatus(false);
          $log.error('Error submitting form data: ', err);
          $translate('error.report.save').then(function(msg) {
          ctrl.setEnketoError(msg);
          });
        });
    };

    $scope.form = null;
    $scope.loadingForm = true;
    $scope.setRightActionBar();
    $scope.setShowContent(true);
    setCancelCallback();
    ContactViewModelGenerator($state.params.id, { merge: true })
      .then(render)
      .catch(function(err) {
        $log.error('Error loading form', err);
        $scope.errorTranslationKey = err.translationKey || 'error.loading.form';
        $scope.contentError = true;
        $scope.loadingForm = false;
      });

    $scope.$on('$destroy', function() {
      unsubscribe();
      if (!$state.includes('contacts.report')) {
        $scope.setTitle();
        Enketo.unload($scope.form);
      }
    });
  }
);
