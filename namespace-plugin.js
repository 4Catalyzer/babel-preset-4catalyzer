const DEFINE_MESSAGES = 'defineMessages';

const COMPONENT_NAMES = ['FormattedMessage', 'FormattedHTMLMessage'];

module.exports = function namespacePlugin({ types: t }) {
  function getPrefix(state) {
    let PREFIX = state.opts.prefix;
    if (!PREFIX.endsWith(':')) PREFIX = `${PREFIX}:`;
  }
  function referencesImport(path) {
    if (!(path.isIdentifier() || path.isJSXIdentifier())) return false;
    return COMPONENT_NAMES.some(name =>
      path.referencesImport('react-intl', name),
    );
  }

  return {
    visitor: {
      JSXOpeningElement(path, state) {
        const name = path.get('name');
        if (!referencesImport(name)) return;

        const PREFIX = getPrefix(state);

        const idAttr = path
          .get('attributes')
          .find(attr => attr.isJSXAttribute() && attr.node.name.name === 'id');

        if (idAttr && !idAttr.node.value.value.startsWith(PREFIX)) {
          idAttr
            .get('value')
            .replaceWith(t.StringLiteral(PREFIX + idAttr.node.value.value));
        }
      },

      CallExpression(path, state) {
        const callee = path.get('callee').node;

        if (!t.isIdentifier(callee) || callee.name !== DEFINE_MESSAGES) {
          return;
        }

        const PREFIX = getPrefix(state);

        function processMessageObject(messageObj) {
          if (!messageObj || !messageObj.isObjectExpression()) {
            return;
          }

          const idProp = messageObj
            .get('properties')
            .find(p => p.get('key').node.name === 'id')
            .get('value');

          if (idProp && !idProp.node.value.startsWith(PREFIX)) {
            idProp.replaceWith(
              t.StringLiteral(PREFIX + idProp.node.value), // eslint-disable-line new-cap
            );
          }
        }

        path
          .get('arguments')[0]
          .get('properties')
          .map(prop => prop.get('value'))
          .forEach(processMessageObject);
      },
    },
  };
};
