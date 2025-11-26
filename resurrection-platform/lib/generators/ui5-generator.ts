/**
 * UI5 Application Generator
 * 
 * Generates SAP Fiori / UI5 applications
 */

import { UIConfig, ProjectFile } from './types';

export class UI5Generator {
  /**
   * Generate UI5 application files
   */
  async generateUI5App(config: UIConfig): Promise<ProjectFile[]> {
    const files: ProjectFile[] = [];

    if (config.type === 'Fiori Elements') {
      files.push(...this.generateFioriElements(config));
    } else {
      files.push(...this.generateFreestyleUI5(config));
    }

    return files;
  }

  /**
   * Generate Fiori Elements application
   */
  private generateFioriElements(config: UIConfig): ProjectFile[] {
    const files: ProjectFile[] = [];

    // Generate manifest.json
    files.push(this.generateManifest(config));

    // Generate index.html
    files.push(this.generateIndexHtml(config));

    // Generate package.json
    files.push(this.generateUI5PackageJson(config));

    return files;
  }

  /**
   * Generate Freestyle UI5 application
   */
  private generateFreestyleUI5(config: UIConfig): ProjectFile[] {
    const files: ProjectFile[] = [];

    // Generate manifest.json
    files.push(this.generateManifest(config));

    // Generate index.html
    files.push(this.generateIndexHtml(config));

    // Generate main view
    files.push(this.generateMainView(config));

    // Generate controller
    files.push(this.generateController(config));

    // Generate package.json
    files.push(this.generateUI5PackageJson(config));

    return files;
  }

  /**
   * Generate manifest.json
   */
  private generateManifest(config: UIConfig): ProjectFile {
    const manifest = {
      '_version': '1.49.0',
      'sap.app': {
        id: config.namespace,
        type: 'application',
        title: '{{appTitle}}',
        description: '{{appDescription}}',
        applicationVersion: {
          version: '1.0.0'
        },
        dataSources: {
          mainService: {
            uri: '/odata/v4/service/',
            type: 'OData',
            settings: {
              odataVersion: '4.0'
            }
          }
        }
      },
      'sap.ui': {
        technology: 'UI5',
        deviceTypes: {
          desktop: true,
          tablet: true,
          phone: true
        }
      },
      'sap.ui5': {
        rootView: {
          viewName: `${config.namespace}.view.Main`,
          type: 'XML',
          id: 'app'
        },
        dependencies: {
          minUI5Version: '1.120.0',
          libs: {
            'sap.m': {},
            'sap.ui.core': {},
            'sap.fe.templates': config.type === 'Fiori Elements' ? {} : undefined
          }
        },
        models: {
          i18n: {
            type: 'sap.ui.model.resource.ResourceModel',
            settings: {
              bundleName: `${config.namespace}.i18n.i18n`
            }
          },
          '': {
            dataSource: 'mainService',
            settings: {
              synchronizationMode: 'None',
              operationMode: 'Server',
              autoExpandSelect: true,
              earlyRequests: true
            }
          }
        },
        routing: {
          config: {
            routerClass: 'sap.m.routing.Router',
            viewType: 'XML',
            viewPath: `${config.namespace}.view`,
            controlId: 'app',
            controlAggregation: 'pages',
            async: true
          },
          routes: [
            {
              pattern: '',
              name: 'main',
              target: 'main'
            }
          ],
          targets: {
            main: {
              viewName: 'Main',
              viewLevel: 1
            }
          }
        }
      }
    };

    return {
      path: `app/${config.namespace}/webapp/manifest.json`,
      content: JSON.stringify(manifest, null, 2)
    };
  }

  /**
   * Generate index.html
   */
  private generateIndexHtml(config: UIConfig): ProjectFile {
    const content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.namespace}</title>
    <script
        id="sap-ui-bootstrap"
        src="https://ui5.sap.com/resources/sap-ui-core.js"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-resourceroots='{
            "${config.namespace}": "./"
        }'
        data-sap-ui-oninit="module:sap/ui/core/ComponentSupport"
        data-sap-ui-compatVersion="edge"
        data-sap-ui-async="true"
        data-sap-ui-frameOptions="trusted">
    </script>
</head>
<body class="sapUiBody">
    <div
        data-sap-ui-component
        data-name="${config.namespace}"
        data-id="container"
        data-settings='{"id" : "app"}'>
    </div>
</body>
</html>
`;

    return {
      path: `app/${config.namespace}/webapp/index.html`,
      content
    };
  }

  /**
   * Generate main view (XML)
   */
  private generateMainView(config: UIConfig): ProjectFile {
    const content = `<mvc:View
    controllerName="${config.namespace}.controller.Main"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns="sap.m"
    displayBlock="true">
    <Page title="{i18n>appTitle}">
        <content>
            <Table
                id="entityTable"
                items="{/EntitySet}"
                growing="true"
                growingThreshold="20">
                <columns>
                    <Column>
                        <Text text="ID" />
                    </Column>
                    <Column>
                        <Text text="Name" />
                    </Column>
                </columns>
                <items>
                    <ColumnListItem>
                        <cells>
                            <Text text="{ID}" />
                            <Text text="{name}" />
                        </cells>
                    </ColumnListItem>
                </items>
            </Table>
        </content>
    </Page>
</mvc:View>
`;

    return {
      path: `app/${config.namespace}/webapp/view/Main.view.xml`,
      content
    };
  }

  /**
   * Generate controller
   */
  private generateController(config: UIConfig): ProjectFile {
    const content = `sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("${config.namespace}.controller.Main", {
        onInit: function () {
            // Initialization logic
        }
    });
});
`;

    return {
      path: `app/${config.namespace}/webapp/controller/Main.controller.js`,
      content
    };
  }

  /**
   * Generate package.json for UI5 app
   */
  private generateUI5PackageJson(config: UIConfig): ProjectFile {
    const content = {
      name: config.namespace,
      version: '1.0.0',
      description: 'UI5 Application',
      scripts: {
        start: 'ui5 serve',
        build: 'ui5 build'
      },
      devDependencies: {
        '@ui5/cli': '^3',
        '@sap/ux-ui5-tooling': '^1'
      }
    };

    return {
      path: `app/${config.namespace}/package.json`,
      content: JSON.stringify(content, null, 2)
    };
  }
}
